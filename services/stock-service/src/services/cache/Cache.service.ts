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

  isConnectionOpen(): boolean {
    return redisClient.isOpen;
  }

  async set(key: string, value: string, options: SetOptions) {
    try {
      if (!this.isConnectionOpen()) {
        this.logger.warn("Can't write data to cache! Connection is not open.", {key, value, options});
        return;
      }
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
      if (!this.isConnectionOpen()) {
        this.logger.warn("Can't read data from cache! Connection is not open.", {key});
        return;
      }
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
