import {createClient} from 'redis';

import {logger} from './logger';

const {CACHE_REDIS_URL} = process.env;

export const redisLogger = logger.child({service: 'redis'});
export const redisClient = createClient({url: CACHE_REDIS_URL});
redisClient.on('connect', () => redisLogger.info('Connected to redis'));
redisClient.on('disconnect', () => redisLogger.info('Disconnected from redis'));
redisClient.on('error', err => redisLogger.error(err));

(async () => {
  if (!CACHE_REDIS_URL) {
    redisLogger.warn("Can't establish an connection! Environment variable 'CACHE_REDIS_URL' not set.");
    return;
  }
  if (process.env.NODE_ENV === 'test') return;
  await redisClient.connect();
})();
