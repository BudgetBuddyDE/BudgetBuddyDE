import {type SetOptions} from 'redis';

import {logger} from '../../logger';
import {redisClient} from '../../redis';

export class Cache {
  private logger = logger.child({service: 'cache'});
  private namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  getKeyWithNamespace(key: string) {
    return `${this.namespace}:${key}`;
  }

  async set(key: string, value: string, options: SetOptions) {
    try {
      key = this.getKeyWithNamespace(key);
      const result = await redisClient.set(key, value, options);
      this.logger.debug(`Value set for '${key}'`);
      return result;
    } catch (error) {
      this.logger.error('SetCacheError', error);
      return null;
    }
  }

  async get(key: string) {
    try {
      key = this.getKeyWithNamespace(key);
      const result = await redisClient.get(key);
      this.logger.debug(result ? `Retrieved value for '${key}'` : `No value found for '${key}'`);
      return result;
    } catch (error) {
      this.logger.error('GetCacheError', error);
      return null;
    }
  }
}
