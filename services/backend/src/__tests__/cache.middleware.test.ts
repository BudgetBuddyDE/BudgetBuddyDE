import type {NextFunction, Request, Response} from 'express';
import {beforeEach, describe, expect, it, suite, vi} from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks – must be declared before the module under test is imported
// ---------------------------------------------------------------------------

const mockRedisGet = vi.fn();
const mockRedisSetex = vi.fn();
const mockRedisScan = vi.fn();
const mockRedisDel = vi.fn();

vi.mock('../db/redis', () => ({
  getRedisClient: () => ({
    get: mockRedisGet,
    setex: mockRedisSetex,
    scan: mockRedisScan,
    del: mockRedisDel,
  }),
}));

vi.mock('../lib/logger', () => ({
  logger: {
    child: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Provide a stable config that the middleware can import
vi.mock('../config', () => ({
  config: {
    cache: {
      enabled: true,
      routes: [
        {path: '/api/category', ttl: 300},
        {path: '/api/transaction', ttl: 60, cacheKeyPrefix: 'txn'},
      ],
    },
  },
}));

import {buildCacheKey, cacheResponse, findMatchingRoute, invalidateCache, isCacheAvailable} from '../middleware';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/api/category',
    originalUrl: '/api/category',
    context: {user: {id: 'user-1'}},
    ...overrides,
  } as unknown as Request;
}

function makeResponse(): Response & {_jsonBody: unknown} {
  const res: Partial<Response> & {_jsonBody: unknown; _headers: Record<string, string>} = {
    _jsonBody: undefined,
    _headers: {},
    statusCode: 200,
    setHeader(key: string, value: string) {
      this._headers[key] = value;
      return this as unknown as Response;
    },
    json(body: unknown) {
      this._jsonBody = body;
      return this as unknown as Response;
    },
    on: vi.fn(),
  };
  return res as unknown as Response & {_jsonBody: unknown};
}

suite('Cache', () => {
  describe('isCacheAvailable', () => {
    it('returns true when REDIS_URL is set and cache is enabled', () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      expect(isCacheAvailable()).toBe(true);
    });

    it('returns false when REDIS_URL is not set', () => {
      delete process.env.REDIS_URL;
      expect(isCacheAvailable()).toBe(false);
    });
  });

  describe('findMatchingRoute', () => {
    it('matches exact path', () => {
      const route = findMatchingRoute('/api/category');
      expect(route?.path).toBe('/api/category');
    });

    it('matches path with sub-segment', () => {
      const route = findMatchingRoute('/api/category/123');
      expect(route?.path).toBe('/api/category');
    });

    it('returns undefined for unknown path', () => {
      expect(findMatchingRoute('/api/unknown')).toBeUndefined();
    });
  });

  describe('buildCacheKey', () => {
    it('uses route path as default prefix', () => {
      const key = buildCacheKey({path: '/api/category', ttl: 300}, 'u1', '/api/category?from=0');
      expect(key).toBe('cache:/api/category:u1:/api/category?from=0');
    });

    it('uses cacheKeyPrefix when provided', () => {
      const key = buildCacheKey({path: '/api/transaction', ttl: 60, cacheKeyPrefix: 'txn'}, 'u1', '/api/transaction');
      expect(key).toBe('cache:txn:u1:/api/transaction');
    });
  });

  describe('cacheResponse', () => {
    const next: NextFunction = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
      process.env.REDIS_URL = 'redis://localhost:6379';
    });

    it('calls next() and skips caching for non-GET requests', async () => {
      const req = makeRequest({method: 'POST'});
      const res = makeResponse();
      await cacheResponse(req, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(mockRedisGet).not.toHaveBeenCalled();
    });

    it('calls next() when caching is disabled (no REDIS_URL)', async () => {
      delete process.env.REDIS_URL;
      const req = makeRequest();
      const res = makeResponse();
      await cacheResponse(req, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(mockRedisGet).not.toHaveBeenCalled();
    });

    it('calls next() when no user is present', async () => {
      const req = makeRequest({context: undefined as never});
      const res = makeResponse();
      await cacheResponse(req, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(mockRedisGet).not.toHaveBeenCalled();
    });

    it('calls next() for a path not in the cache config', async () => {
      const req = makeRequest({path: '/api/unknown', originalUrl: '/api/unknown'});
      const res = makeResponse();
      await cacheResponse(req, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(mockRedisGet).not.toHaveBeenCalled();
    });

    it('returns cached response on cache HIT and sets X-Cache: HIT header', async () => {
      const payload = {status: 200, data: [{id: 1}]};
      mockRedisGet.mockResolvedValueOnce(JSON.stringify(payload));

      const req = makeRequest();
      const res = makeResponse();
      await cacheResponse(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect((res as unknown as {_headers: Record<string, string>})._headers['X-Cache']).toBe('HIT');
      expect((res as unknown as {_jsonBody: unknown})._jsonBody).toEqual(payload);
    });

    it('on cache MISS: calls next(), caches response via setex, sets X-Cache: MISS header', async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockRedisSetex.mockResolvedValueOnce('OK');

      const req = makeRequest();
      const res = makeResponse();
      await cacheResponse(req, res, next);

      // next() should have been called so the route handler runs
      expect(next).toHaveBeenCalledOnce();

      // Simulate route handler calling res.json
      const responseBody = {status: 200, data: []};
      res.json(responseBody);

      expect(mockRedisSetex).toHaveBeenCalledWith(
        expect.stringContaining('cache:/api/category:user-1:'),
        300,
        JSON.stringify(responseBody),
      );
      expect((res as unknown as {_headers: Record<string, string>})._headers['X-Cache']).toBe('MISS');
    });

    it('does not cache non-2xx responses', async () => {
      mockRedisGet.mockResolvedValueOnce(null);

      const req = makeRequest();
      const res = makeResponse();
      res.statusCode = 404;

      await cacheResponse(req, res, next);
      res.json({error: 'not found'});

      expect(mockRedisSetex).not.toHaveBeenCalled();
    });

    it('calls next() and skips cache when Redis throws', async () => {
      mockRedisGet.mockRejectedValueOnce(new Error('Redis down'));
      const req = makeRequest();
      const res = makeResponse();
      await cacheResponse(req, res, next);
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('invalidateCache', () => {
    const next: NextFunction = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
      process.env.REDIS_URL = 'redis://localhost:6379';
    });

    it('calls next() for GET requests without touching Redis', async () => {
      const req = makeRequest({method: 'GET'});
      const res = makeResponse();
      await invalidateCache(req, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.on).not.toHaveBeenCalled();
    });

    it('calls next() when caching is disabled', async () => {
      delete process.env.REDIS_URL;
      const req = makeRequest({method: 'POST'});
      const res = makeResponse();
      await invalidateCache(req, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.on).not.toHaveBeenCalled();
    });

    it('calls next() for path not in cache config', async () => {
      const req = makeRequest({method: 'DELETE', path: '/api/unknown', originalUrl: '/api/unknown'});
      const res = makeResponse();
      await invalidateCache(req, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.on).not.toHaveBeenCalled();
    });

    it('registers a "finish" listener for POST on a matched route', async () => {
      const req = makeRequest({method: 'POST'});
      const res = makeResponse();
      await invalidateCache(req, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('invalidates matching cache keys on finish', async () => {
      mockRedisScan.mockResolvedValueOnce([
        '0',
        ['cache:/api/category:user-1:/api/category', 'cache:/api/category:user-1:/api/category?from=0'],
      ]);
      mockRedisDel.mockResolvedValueOnce(2);

      const req = makeRequest({method: 'DELETE', path: '/api/category/123', originalUrl: '/api/category/123'});
      // Use a real event emitter so we can trigger 'finish'
      const listeners: Record<string, () => void> = {};
      const res = {
        ...makeResponse(),
        on: (event: string, cb: () => void) => {
          listeners[event] = cb;
        },
      } as unknown as Response;

      await invalidateCache(req, res, next);

      // Trigger the finish event
      await listeners.finish();

      expect(mockRedisScan).toHaveBeenCalledWith('0', 'MATCH', 'cache:/api/category:user-1:*', 'COUNT', 100);
      expect(mockRedisDel).toHaveBeenCalledWith(
        'cache:/api/category:user-1:/api/category',
        'cache:/api/category:user-1:/api/category?from=0',
      );
    });

    it('uses cacheKeyPrefix in invalidation pattern', async () => {
      mockRedisScan.mockResolvedValueOnce(['0', []]);

      const req = makeRequest({method: 'PUT', path: '/api/transaction/5', originalUrl: '/api/transaction/5'});
      const listeners: Record<string, () => void> = {};
      const res = {
        ...makeResponse(),
        on: (event: string, cb: () => void) => {
          listeners[event] = cb;
        },
      } as unknown as Response;

      await invalidateCache(req, res, next);
      await listeners.finish();

      // cacheKeyPrefix is 'txn' for transaction route
      expect(mockRedisScan).toHaveBeenCalledWith('0', 'MATCH', 'cache:txn:user-1:*', 'COUNT', 100);
    });
  });
});
