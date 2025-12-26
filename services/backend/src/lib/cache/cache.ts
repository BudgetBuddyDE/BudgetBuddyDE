import type Redis from 'ioredis';
import type {Logger} from 'winston';
import {getRedisClient} from '../../db/redis';
import {logger} from '../logger';

export class Cache {
  protected readonly logger: Logger;
  protected redisClient: Redis;
  protected namespace: string;

  constructor(namespace: string) {
    this.logger = logger.child({label: 'Cache'});
    this.redisClient = getRedisClient();
    this.namespace = namespace;
  }

  protected getKey(key: string): `${string}:${string}` {
    return `${this.namespace}:${key}`;
  }

  async setValue(key: string, value: string, options?: {ttl: number}) {
    try {
      key = this.getKey(key);
      const result = options?.ttl
        ? await this.redisClient.set(key, value, 'EX', options.ttl)
        : await this.redisClient.set(key, value);
      this.logger.debug(`Value set for '${key}'`);
      return result;
    } catch (error) {
      this.logger.error('SetCacheError', error);
      return 'ERROR';
    }
  }

  async getValue(key: string) {
    try {
      key = this.getKey(key);
      const result = await this.redisClient.get(key);
      this.logger.debug(result ? `Retrieved value for '${key}'` : `No value found for '${key}'`);
      return result;
    } catch (error) {
      this.logger.error('GetCacheError', error);
      return null;
    }
  }
}
