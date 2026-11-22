import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:http';
import {setTimeout} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import Redis from 'ioredis';

// Run only against an explicitly selected disposable DB with the existing migrations applied.
const databaseUrl = new URL(process.env.TEST_DATABASE_URL);
assert.equal(databaseUrl.hostname, 'localhost');
assert.match(databaseUrl.pathname, /^\/nitro_auth_smoke_\w+$/);
const redisUrl = new URL(process.env.TEST_REDIS_URL);
assert.equal(redisUrl.hostname, 'localhost');
const redis = new Redis(redisUrl.href, {db: 15});
const mail = createServer((_req, res) => res.writeHead(200, {'content-type': 'application/json'}).end('{"id":"local"}'));
const servers = [];
const origin = 'http://localhost:3000';
const legacy = 'http://localhost:19101';
const nitro = 'http://localhost:19102';
const body = {email: `smoke-${crypto.randomUUID()}@example.invalid`, name: 'Smoke', password: crypto.randomUUID()};

async function start(path, url, readiness) {
  const port = new URL(url).port;
  const child = spawn(process.execPath, [fileURLToPath(new URL(path, import.meta.url))], {
    env: {...process.env, NODE_ENV: 'test', BASE_URL: url, TRUSTED_ORIGINS: origin, PORT: port, NITRO_PORT: port,
      DATABASE_URL: databaseUrl.href, AUTH_REDIS_URL: redisUrl.href, AUTH_REDIS_DB: '15', REDIS_URL: redisUrl.href,
      AUTH_SECRET: 'test-only-shared-secret-for-backend-session-migration', RESEND_API_KEY: 're_test',
      RESEND_BASE_URL: `http://localhost:${mail.address().port}`, LOG_LEVEL: 'silent'},
    stdio: 'inherit',
  });
  servers.push(child);
  for (let i = 0; i < 100; i++) {
    assert.equal(child.exitCode, null, 'Server exited before readiness');
    if (await fetch(url + readiness).then(r => r.ok, () => false)) return;
    await setTimeout(100);
  }
  throw new Error(`Server not ready: ${url}`);
}

function request(base, route, data, headers = {}) {
  return fetch(`${base}/api/auth/${route}`, {
    method: data ? 'POST' : 'GET', headers: {origin, 'content-type': 'application/json', ...headers},
    body: data ? JSON.stringify(data) : undefined,
  });
}
function sessionCookie(response) {
  assert.equal(response.status, 200);
  const cookies = response.headers.getSetCookie();
  assert.ok(cookies.length >= 2);
  return cookies.map(c => c.split(';')[0]).find(c => c.startsWith('budget-buddy.session_token='));
}

try {
  mail.listen(0, '127.0.0.1');
  await once(mail, 'listening');
  await start('../../backend/build/src/server.js', legacy, '/api/auth/ok');
  await start('../build/server/index.mjs', nitro, '/health');
  const signup = await request(legacy, 'sign-up/email', body);
  const cookie = sessionCookie(signup);
  assert.ok(cookie);
  const {user} = await signup.json();
  const lookup = await request(nitro, 'get-session', undefined, {cookie});
  assert.equal(lookup.headers.get('access-control-allow-origin'), origin);
  assert.equal((await lookup.json()).user.id, user.id);
  const signin = await request(nitro, 'sign-in/email', body);
  const newCookie = sessionCookie(signin);
  assert.ok(newCookie);
  const {token} = await signin.json();
  assert.ok(await redis.ttl(token) > 0);
  assert.equal((await (await request(legacy, 'get-session', undefined, {cookie: newCookie})).json()).user.id, user.id);
  const created = await request(nitro, 'api-key/create', {name: 'smoke'}, {cookie: newCookie});
  assert.equal(created.status, 200);
  const {key, id} = await created.json();
  assert.match(key, /^bb-/);
  assert.equal((await (await request(nitro, 'get-session', undefined, {'x-api-key': key})).json()).user.id, user.id);
  assert.equal((await request(nitro, 'api-key/delete', {keyId: id}, {cookie: newCookie})).status, 200);
  assert.equal((await request(nitro, 'get-session', undefined, {'x-api-key': key})).status, 401);
  assert.equal((await request(nitro, 'sign-out', {}, {cookie: newCookie, origin: 'https://untrusted.invalid'})).status, 403);
  assert.equal((await request(nitro, 'sign-out', {}, {cookie: newCookie})).status, 200);
  assert.equal(await redis.exists(token), 0);
  assert.equal(await (await request(nitro, 'get-session', undefined, {cookie: newCookie})).json(), null);
  const nitroSignup = await request(nitro, 'sign-up/email', {...body, email: `new-${body.email}`});
  const expiringCookie = sessionCookie(nitroSignup);
  assert.ok(expiringCookie);
  const {token: expiringToken} = await nitroSignup.json();
  assert.equal(await redis.pexpire(expiringToken, 1), 1);
  await setTimeout(20);
  assert.equal(await (await request(nitro, 'get-session', undefined, {cookie: expiringCookie})).json(), null);
  console.log('PASS: session migration in both directions, registration, logout, Redis TTL, CORS and API keys');
} finally {
  for (const server of servers) if (server.exitCode === null) server.kill();
  redis.disconnect();
  mail.close();
}
