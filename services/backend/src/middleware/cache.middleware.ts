import type {NextFunction, Request, Response} from 'express';
import {type CacheRouteConfig, config} from '../config';
import {getRedisClient} from '../db/redis';
import {logger} from '../lib';

const cacheLogger = logger.child({label: 'cache'});

/**
 * Returns true when caching should be attempted (Redis URL is set and caching is globally enabled).
 */
export function isCacheAvailable(): boolean {
  return Boolean(process.env.REDIS_URL) && config.cache.enabled;
}

/**
 * Finds the first route config whose path prefix matches the given request path.
 */
export function findMatchingRoute(requestPath: string): CacheRouteConfig | undefined {
  return config.cache.routes.find(
    r => requestPath === r.path || requestPath.startsWith(`${r.path}/`) || requestPath.startsWith(`${r.path}?`),
  );
}

/**
 * Builds a per-user cache key that includes the full URL (path + query string).
 */
export function buildCacheKey(route: CacheRouteConfig, userId: string, originalUrl: string): string {
  const prefix = route.cacheKeyPrefix ?? route.path;
  return `cache:${prefix}:${userId}:${originalUrl}`;
}

/**
 * Middleware that serves GET responses from Redis when available.
 *
 * - Only active when Redis is configured and caching is enabled.
 * - Adds `X-Cache: HIT` or `X-Cache: MISS` response headers.
 * - Skips silently on errors so the request still reaches the route handler.
 */
export async function cacheResponse(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isCacheAvailable() || req.method !== 'GET') {
    next();
    return;
  }

  const userId = req.context?.user?.id;
  if (!userId) {
    next();
    return;
  }

  const route = findMatchingRoute(req.path);
  if (!route) {
    next();
    return;
  }

  try {
    const redis = getRedisClient();
    const cacheKey = buildCacheKey(route, userId, req.originalUrl);

    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      res.setHeader('X-Cache', 'HIT');
      res.json(JSON.parse(cached));
      return;
    }

    // Intercept res.json to persist the response body in Redis
    const originalJson = res.json.bind(res);
    // biome-ignore lint/suspicious/noExplicitAny: intentional override of res.json with same signature
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis.setex(cacheKey, route.ttl, JSON.stringify(body)).catch(err => {
          cacheLogger.error('Failed to store response in cache', {cacheKey, err});
        });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  } catch (err) {
    cacheLogger.error('Cache lookup failed, skipping cache', err);
    next();
  }
}

/**
 * Middleware that invalidates cached GET responses after a successful mutating request (POST, PUT, DELETE).
 *
 * All cached keys for the matched route and current user are removed via Redis SCAN + DEL.
 */
export async function invalidateCache(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!isCacheAvailable() || !['POST', 'PUT', 'DELETE'].includes(req.method)) {
    next();
    return;
  }

  const userId = req.context?.user?.id;
  if (!userId) {
    next();
    return;
  }

  const route = findMatchingRoute(req.path);
  if (!route) {
    next();
    return;
  }

  res.on('finish', async () => {
    try {
      const redis = getRedisClient();
      const prefix = route.cacheKeyPrefix ?? route.path;
      const pattern = `cache:${prefix}:${userId}:*`;

      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
          cacheLogger.debug('Invalidated %d cache keys matching "%s"', keys.length, pattern, {keys});
        }
      } while (cursor !== '0');
    } catch (err) {
      cacheLogger.error('Cache invalidation failed', err);
    }
  });

  next();
}
