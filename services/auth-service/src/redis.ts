import 'dotenv/config';
import {createClient} from 'redis';

import {logger} from './core/logger';

const {REDIS_URL} = process.env;

const redisLogger = logger.child({label: 'redis'});
export const redisClient = createClient({url: REDIS_URL, database: 1});
redisClient.on('connect', () => redisLogger.info('Connected to redis'));
redisClient.on('error', err => redisLogger.error(err));

export function isRedisConnected(): boolean {
  return redisClient.isOpen;
}

export async function connectToRedis(reconnect = false) {
  if (!REDIS_URL) {
    throw new Error('Environment variable REDIS_URL is not defined');
  }

  const conn = await redisClient.connect();
  redisClient.on('disconnect', async () => {
    redisLogger.info('Disconnected from redis!');
    if (reconnect) {
      await redisClient.connect();
      redisLogger.info('Reconnected to redis!');
    } else redisLogger.info('Reconnect is disabled!');
  });

  return conn;
}
