import type {AddressInfo} from 'node:net';
import type {Request, Response} from 'express';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  config: {
    service: 'backend',
    version: '1',
    runtime: 'test',
    port: 0,
    log: {level: 'silent'},
    trustProxy: false,
    cors: {origin: ['http://localhost:3000'], credentials: true},
    redis: {url: undefined as string | undefined},
    rateLimit: {enabled: false, keyPrefix: 'domain:', options: {limit: 300, windowMs: 300000}},
    auth: {
      redis: {url: undefined as string | undefined},
      rateLimit: {enabled: false, keyPrefix: 'auth:', options: {limit: 500, windowMs: 300000}},
      exportRateLimit: {enabled: false, keyPrefix: 'auth-export:', options: {limit: 2, windowMs: 900000}},
    },
    jobs: {recurringPayments: {name: 'payments', schedule: '30 1 * * *', timezone: 'Europe/Berlin'}},
  },
  getSession: vi.fn(),
  checkConnection: vi.fn(),
  end: vi.fn(),
  closeRedis: vi.fn(),
  destroyS3: vi.fn(),
  redis: {status: 'ready', call: vi.fn()},
  authRedis: {status: 'ready', call: vi.fn()},
  authHandler: vi.fn(),
  exportHandler: vi.fn(),
  cache: vi.fn(),
  invalidate: vi.fn(),
  rateLimit: vi.fn(),
  stores: [] as any[],
  validation: undefined as any,
  schedule: vi.fn(),
  stop: vi.fn(),
  recurring: vi.fn(),
  logger: {info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn()},
}));
vi.mock('./config', () => ({config: mocks.config}));
vi.mock('./auth', () => ({auth: {api: {getSession: mocks.getSession}}}));
vi.mock('better-auth/node', () => ({toNodeHandler: () => mocks.authHandler}));
vi.mock('./authExport', () => ({authExportHandler: mocks.exportHandler}));
vi.mock('./db', () => ({checkConnection: mocks.checkConnection, pool: {end: mocks.end}}));
vi.mock('./db/redis', () => ({
  getRedisClient: () => mocks.redis,
  getAuthRedisClient: () => mocks.authRedis,
  closeRedis: mocks.closeRedis,
}));
vi.mock('./lib/logger', () => ({
  logger: {...mocks.logger, child: () => ({...mocks.logger, child: () => mocks.logger})},
}));
vi.mock('./lib/s3', () => ({destroyS3Client: mocks.destroyS3}));
vi.mock('./jobs/processRecurringPayments', () => ({processRecurringPayments: mocks.recurring}));
vi.mock('node-cron', () => ({default: {schedule: mocks.schedule}}));
vi.mock('./middleware/cache.middleware', () => ({cacheResponse: mocks.cache, invalidateCache: mocks.invalidate}));
vi.mock('express-rate-limit', () => ({default: mocks.rateLimit, ipKeyGenerator: (ip: string) => `ip:${ip}`}));
vi.mock('rate-limit-redis', () => ({
  default: class {
    constructor(public options: any) {
      mocks.stores.push(this);
    }
  },
}));
vi.mock('express-zod-safe', () => ({
  setGlobalErrorHandler: (handler: any) => {
    mocks.validation = handler;
  },
}));
vi.mock('./router', async () => {
  const {Router} = await import('express');
  const router = Router();
  router.get('/fail', () => {
    throw new Error('database credential');
  });
  router.get('/validation', (req, res) => mocks.validation({query: {id: 'invalid'}}, req, res));
  router.get('/', (_req, res) => res.json({ok: true}));
  return Object.fromEntries(
    [
      'Application',
      'Attachment',
      'Budget',
      'Category',
      'Insights',
      'PaymentMethod',
      'RecurringPayment',
      'Transaction',
    ].map(name => [`${name}Router`, router]),
  );
});
import {createApp, startServer} from './server';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.stores.length = 0;
  mocks.config.redis.url = undefined;
  mocks.config.auth.redis.url = undefined;
  mocks.config.auth.rateLimit.enabled = false;
  mocks.config.auth.exportRateLimit.enabled = false;
  mocks.config.rateLimit.enabled = false;
  mocks.redis.status = mocks.authRedis.status = 'ready';
  mocks.checkConnection.mockResolvedValue(true);
  mocks.getSession.mockResolvedValue({user: {id: 'owner'}, session: {id: 'session'}});
  mocks.end.mockResolvedValue(undefined);
  mocks.closeRedis.mockResolvedValue(undefined);
  mocks.schedule.mockReturnValue({stop: mocks.stop});
  mocks.cache.mockImplementation((_req, _res, next) => next());
  mocks.invalidate.mockImplementation((_req, _res, next) => next());
  mocks.rateLimit.mockImplementation(() => (_req: Request, _res: Response, next: () => void) => next());
  mocks.exportHandler.mockImplementation((_req, res) => res.status(200).send('archive'));
  mocks.authHandler.mockImplementation(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    res.status(200).json({raw, parsed: req.body ?? null});
  });
});
afterEach(() => vi.restoreAllMocks());

async function request(path: string, options: RequestInit = {}) {
  const server = createApp().listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const res = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`, options);
    const text = await res.text();
    return {status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null};
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

describe('backend app composition', () => {
  it('keeps public auth request streams intact before session and cache middleware', async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: {'content-type': 'application/json', origin: 'http://localhost:3000'},
      body: '{"email":"ada@example.com"}',
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({raw: '{"email":"ada@example.com"}', parsed: null});
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
    expect(res.headers.get('x-served-by')).toBe('backend::1');
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.cache).not.toHaveBeenCalled();
  });

  it('dispatches export before the auth wildcard and domain middleware', async () => {
    mocks.exportHandler.mockImplementation((_req, res) => res.json({archive: true}));
    expect((await request('/api/auth/export?format=csv')).body).toEqual({archive: true});
    expect(mocks.exportHandler).toHaveBeenCalledOnce();
    expect(mocks.authHandler).not.toHaveBeenCalled();
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it('rejects anonymous domain requests and preserves /api/me context response', async () => {
    mocks.getSession.mockResolvedValue(null);
    expect((await request('/api/category')).status).toBe(401);
    expect(mocks.cache).not.toHaveBeenCalled();
    mocks.getSession.mockResolvedValue({user: {id: 'owner'}, session: {id: 'session'}});
    const res = await request('/api/me');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({user: {id: 'owner'}, session: {id: 'session'}});
    expect(mocks.cache).toHaveBeenCalledOnce();
    expect((await request('/api/me', {method: 'DELETE'})).status).toBe(501);
    mocks.getSession.mockResolvedValue({user: null, session: {id: 'session'}});
    expect((await request('/api/me', {method: 'DELETE'})).status).toBe(401);
  });

  it('maps session failures, validation, unknown routes and unexpected errors', async () => {
    mocks.getSession.mockRejectedValueOnce(new Error('secret'));
    expect((await request('/api/me')).status).toBe(503);
    expect((await request('/api/category/validation')).status).toBe(400);
    expect((await request('/api/missing')).status).toBe(404);
    const error = await request('/api/category/fail');
    expect(error.status).toBe(500);
    expect(JSON.stringify(error.body)).not.toContain('database credential');
  });

  it('checks database health publicly and responds to HEAD without querying', async () => {
    const res = await request('/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      status: 'ok',
      database: true,
      redis: {status: 'not_configured', isReachable: true},
      authRedis: {status: 'not_configured', isReachable: true},
    });
    expect(mocks.getSession).not.toHaveBeenCalled();
    mocks.checkConnection.mockClear();
    expect((await request('/health', {method: 'HEAD'})).status).toBe(200);
    expect(mocks.checkConnection).not.toHaveBeenCalled();
    mocks.checkConnection.mockResolvedValue(false);
    expect((await request('/health')).status).toBe(500);
  });

  it('degrades health for either configured Redis store and bounded database timeout', async () => {
    mocks.config.redis.url = 'redis://domain';
    mocks.config.auth.redis.url = 'redis://auth';
    expect((await request('/health')).status).toBe(200);
    mocks.redis.status = 'reconnecting';
    expect((await request('/health')).body.data.redis.isReachable).toBe(false);
    mocks.redis.status = 'ready';
    mocks.authRedis.status = 'end';
    expect((await request('/health')).status).toBe(500);
    mocks.checkConnection.mockReturnValue(new Promise(() => {}));
    const res = await request('/health');
    expect(res.status).toBe(500);
    expect(res.body.data.database).toBe(false);
  });

  it('mounts independent rate limits with dedicated prefixes and Redis commands', async () => {
    mocks.config.redis.url = 'redis://domain';
    mocks.config.auth.redis.url = 'redis://auth';
    mocks.config.auth.rateLimit.enabled =
      mocks.config.auth.exportRateLimit.enabled =
      mocks.config.rateLimit.enabled =
        true;
    createApp();
    const options = mocks.rateLimit.mock.calls.map(([option]) => option);
    expect(options.map(option => [option.limit, option.windowMs, option.store.options.prefix])).toEqual([
      [500, 300000, 'auth:'],
      [2, 900000, 'auth-export:'],
      [300, 300000, 'domain:'],
    ]);
    mocks.redis.call.mockResolvedValue('OK');
    for (const {options: storeOptions} of mocks.stores) await storeOptions.sendCommand('GET', 'key');
    expect(mocks.redis.call).toHaveBeenCalledTimes(1);
    expect(mocks.authRedis.call).toHaveBeenCalledTimes(2);
    expect(options[1].keyGenerator({ip: '127.0.0.1'})).toBe('ip:127.0.0.1');
    expect(options[1].keyGenerator({})).toBe('ip:unknown');
    const res = {status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), end: vi.fn()};
    options[1].handler({}, res);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({message: 'Too many export requests. Please try again later.'}),
    );
  });

  it('falls back to backend Redis when auth Redis is absent', async () => {
    mocks.config.redis.url = 'redis://domain';
    mocks.config.auth.rateLimit.enabled = true;
    createApp();
    await mocks.stores[0].options.sendCommand('INCR', 'key');
    expect(mocks.redis.call).toHaveBeenCalledWith('INCR', 'key');
    expect(mocks.authRedis.call).not.toHaveBeenCalled();
  });

  it('uses auth Redis for auth limits when no domain Redis exists', async () => {
    mocks.config.auth.redis.url = 'redis://auth';
    mocks.config.auth.rateLimit.enabled = true;
    mocks.config.auth.exportRateLimit.enabled = true;
    createApp();
    for (const {options} of mocks.stores) await options.sendCommand('INCR', 'key');
    expect(mocks.authRedis.call).toHaveBeenCalledTimes(2);
    expect(mocks.redis.call).not.toHaveBeenCalled();
  });
});

describe('backend startup and shutdown', () => {
  it.each(['SIGINT', 'SIGTERM'] as const)('starts cron and cleans every resource on %s', async signal => {
    const listeners = new Map<string, (...args: any[]) => unknown>();
    const once = process.once.bind(process);
    vi.spyOn(process, 'once').mockImplementation(((event: string, handler: (...args: any[]) => void) => {
      if (event === 'SIGINT' || event === 'SIGTERM') {
        listeners.set(event, handler);
        return process;
      }
      return once(event as never, handler);
    }) as typeof process.once);
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const server = startServer();
    await new Promise<void>(resolve => server.once('listening', resolve));
    expect(mocks.schedule).toHaveBeenCalledWith('30 1 * * *', mocks.recurring, {
      name: 'payments',
      timezone: 'Europe/Berlin',
    });
    mocks.end.mockRejectedValueOnce(new Error('pool already disconnected'));
    listeners.get(signal)!(signal);
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
    expect(mocks.stop).toHaveBeenCalledOnce();
    expect(mocks.end).toHaveBeenCalledOnce();
    expect(mocks.closeRedis).toHaveBeenCalledOnce();
    expect(mocks.destroyS3).toHaveBeenCalledOnce();
    expect(server.listening).toBe(false);
  });
});
