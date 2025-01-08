import 'dotenv/config';
import {createClient} from 'redis';

import {logger} from './core/logger';

const {REDIS_URL} = process.env;

export const redisLogger = logger.child({service: 'redis'});
export const redisClient = createClient({url: REDIS_URL, database: 1});
redisClient.on('connect', () => redisLogger.info('Connected to redis'));
redisClient.on('disconnect', () => redisLogger.info('Disconnected from redis'));
redisClient.on('error', err => redisLogger.error(err));

(async () => {
  if (process.env.NODE_ENV === 'test' || !REDIS_URL) return;
  await redisClient.connect();
})();
