import type Redis from 'ioredis';
import type {Logger} from '@budgetbuddyde/logger';
import {config} from '../../config';
import {getRedisClient} from '../../db/redis';
import {logger} from '../logger';

/** Redis-backed cache that degrades to a no-op when Redis is not configured. */
export class Cache {
  protected readonly logger: Logger;
  protected redisClient: Redis | null;
  protected namespace: string;

  constructor(namespace: string) {
    this.logger = logger.child({module: 'Cache'});
    this.redisClient = config.redis.url ? getRedisClient() : null;
    this.namespace = namespace;
  }

  protected getKey(key: string): `${string}:${string}` {
    return `${this.namespace}:${key}`;
  }

  async setValue(key: string, value: string, options?: {ttl: number}) {
    if (!this.redisClient) return 'ERROR';
    try {
      key = this.getKey(key);
      const result = options?.ttl
        ? await this.redisClient.set(key, value, 'EX', options.ttl)
        : await this.redisClient.set(key, value);
      this.logger.debug(`Value set for '${key}'`);
      return result;
    } catch (error) {
      this.logger.error('SetCacheError', error instanceof Error ? error : new Error(String(error)));
      return 'ERROR';
    }
  }

  async getValue<Result extends string = string>(key: string) {
    if (!this.redisClient) return null;
    try {
      key = this.getKey(key);
      const result = await this.redisClient.get(key);
      this.logger.debug(result ? `Retrieved value for '${key}'` : `No value found for '${key}'`);
      return result as Result | null;
    } catch (error) {
      this.logger.error('GetCacheError', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async deleteValue(key: string) {
    if (!this.redisClient) return 0;
    try {
      key = this.getKey(key);
      const result = await this.redisClient.del(key);
      this.logger.debug(`Deleted value for '${key}'`);
      return result;
    } catch (error) {
      this.logger.error('DeleteCacheError', error instanceof Error ? error : new Error(String(error)));
      return 0;
    }
  }
}
