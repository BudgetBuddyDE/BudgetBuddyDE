import Redis from 'ioredis';
import {config} from '../config';
import {logger} from '../lib/logger';

const redisLogger = logger.child({module: 'redis'});

let redis: Redis | null = null;

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
