import Redis from 'ioredis';
import {getPool} from '../lib/database';

async function checkRedis(name: 'kv' | 'auth'): Promise<boolean> {
  const {driver} = useStorage().getMount(name);
  const client: unknown = driver.getInstance?.();
  return client instanceof Redis && (await client.ping()) === 'PONG';
}

let pending: Promise<boolean> | undefined;

async function checkDependencies(): Promise<boolean> {
  const checks = [checkDatabase(), checkRedis('kv')];
  if (process.env.AUTH_REDIS_URL) checks.push(checkRedis('auth'));
  const results = await Promise.allSettled(checks);
  return results.every(result => result.status === 'fulfilled' && result.value);
}

async function checkDatabase(): Promise<boolean> {
  const client = await getPool().connect();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    client.release(true);
  }, 1500);
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
        timeout = setTimeout(() => resolve(false), 2000);
      }),
    ]);
    if (ready) return 'OK';
    setResponseStatus(event, 503);
    return 'Service Unavailable';
  } finally {
    clearTimeout(timeout);
  }
});
