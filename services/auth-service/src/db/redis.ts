import 'dotenv/config';
import {createClient} from 'redis';

import {config} from '../config';
import {logger} from '../core/logger';

const redisLogger = logger.child({label: 'redis'});
export const redisClient = createClient(config.db.redis);
redisClient.on('connect', () => redisLogger.info('Connected to redis'));
redisClient.on('error', err => redisLogger.error(err));

export function isRedisConnected(): boolean {
  return redisClient.isOpen;
}

export async function connectToRedis(reconnect = false) {
  if (!config.db.redis || !config.db.redis.url) {
    throw new Error('Environment variable REDIS_URL is not defined');
  }

  logger.debug('Connecting to redis with url %s', config.db.redis.url);
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
