import Redis from 'ioredis';
import {logger} from '../lib/logger';
import {EnvironmentVariableNotSetError} from '../types/error';

const redisLogger = logger.child({label: 'redis'});

let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    // assert(redisUrl !== undefined, 'REDIS_URL environment variable is not set');
    if (redisUrl === undefined) {
      throw new EnvironmentVariableNotSetError('REDIS_URL');
    }
    redis = new Redis(redisUrl, {
      db: 0,
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
