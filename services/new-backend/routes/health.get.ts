import Redis from 'ioredis';
import {BackendConfig} from '../lib/config';
import {getPool} from '../lib/database';

/** Requires `PONG` from the specified Redis mount, except when optional auth Redis is not configured. */
async function checkRedis(name: 'kv' | 'auth'): Promise<boolean> {
  const {redis} = BackendConfig.getInstance();
  if (name === 'auth' && !redis.authConfigured) return true;
  if (!redis[name]) return false;
  const {driver} = useStorage().getMount(name);
  const client: unknown = driver.getInstance?.();
  if (!(client instanceof Redis)) return false;
  return (await client.ping()) === 'PONG';
}

let pending: Promise<boolean> | undefined;

/** Checks the database and required Redis connections in parallel; returns false if any check fails. */
async function checkDependencies(): Promise<boolean> {
  const checks = [checkDatabase(), checkRedis('kv'), checkRedis('auth')];
  const results = await Promise.allSettled(checks);
  return results.every(result => result.status === 'fulfilled' && result.value);
}

/** Runs a simple database query and destroys the connection if it times out after 1.5 seconds. */
async function checkDatabase(): Promise<boolean> {
  const client = await getPool().connect();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    client.release(true);
  }, BackendConfig.getInstance().health.queryTimeoutMs);
  try {
    await client.query('SELECT 1');
    return true;
  } finally {
    clearTimeout(timeout);
    if (!timedOut) client.release();
  }
}

export default defineEventHandler(async event => {
  setResponseHeader(event, 'Cache-Control', 'no-store');
  // Share the in-flight probe so repeated requests cannot queue checks against a stalled dependency.
  pending ??= checkDependencies().finally(() => {
    pending = undefined;
  });
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const ready = await Promise.race([
      pending,
      new Promise<boolean>(resolve => {
        timeout = setTimeout(() => resolve(false), BackendConfig.getInstance().health.responseTimeoutMs);
      }),
    ]);
    if (ready) return 'OK';
    setResponseStatus(event, 503);
    return 'Service Unavailable';
  } finally {
    clearTimeout(timeout);
  }
});
