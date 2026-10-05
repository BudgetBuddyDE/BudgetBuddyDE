import Redis from 'ioredis';
import {config} from '../config';
import {logger} from '../lib/logger';

const redisLogger = logger.child({module: 'redis'});

let redis: Redis | null = null;
let authRedis: Redis | null = null;

/** Auth sessions keep their existing Redis database independently of domain caches. */
export function getAuthRedisClient(): Redis {
  if (!authRedis) {
    const {url, database} = config.auth.redis;
    if (!url) throw new Error('AUTH_REDIS_URL is not configured.');
    authRedis = new Redis(url, {
      db: database,
      // A local session lookup must fail promptly when its storage is unavailable.
      connectTimeout: 5000,
      commandTimeout: 5000,
      maxRetriesPerRequest: 1,
    });
    authRedis.on('error', err => redisLogger.error('Auth Redis error:', err));
  }
  return authRedis;
}

export function getRedisClient(): Redis {
  if (!redis) {
    const redisConfig = config.getRequiredRedisConfig();
    redis = new Redis(redisConfig.url, {
      db: redisConfig.database,
    });

    redis.on('connect', () => {
      redisLogger.info('Connected to Redis');
    });

    redis.on('reconnecting', () => {
      redisLogger.info('Reconnecting to Redis');
    });

    redis.on('close', () => {
      redisLogger.info('Disconnected from Redis');
    });

    redis.on('error', err => {
      redisLogger.error('Redis error:', err);
    });
  }
  return redis;
}

/** Closes the shared Redis connection during graceful shutdown. */
export async function closeRedis(): Promise<void> {
  const clients = [redis, authRedis].filter((client): client is Redis => client !== null);
  redis = null;
  authRedis = null;
  await Promise.allSettled(clients.map(client => client.quit()));
}
