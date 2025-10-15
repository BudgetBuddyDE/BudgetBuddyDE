import cds from "@sap/cds";
import Redis from "ioredis";
import { getRedisClient } from "../lib/redis";

export class Cache {
  protected readonly logger: ReturnType<typeof cds.log>;
  protected redisClient: Redis;
  protected namespace: string;

  constructor(namespace: string) {
    this.logger = cds.log(namespace, {
      label: `cache:${namespace}`,
      level: "info",
    });
    this.redisClient = getRedisClient();
    this.namespace = namespace;
  }

  protected getKey(key: string): `${string}:${string}` {
    return `${this.namespace}:${key}`;
  }

  async setValue(key: string, value: string, options?: { ttl: number }) {
    try {
      key = this.getKey(key);
      const result = options?.ttl
        ? await this.redisClient.set(key, value, "EX", options.ttl)
        : await this.redisClient.set(key, value);
      this.logger.debug(`Value set for '${key}'`);
      return result;
    } catch (error) {
      this.logger.error("SetCacheError", error);
      return "ERROR";
    }
  }

  async getValue(key: string) {
    try {
      key = this.getKey(key);
      const result = await this.redisClient.get(key);
      this.logger.debug(
        result ? `Retrieved value for '${key}'` : `No value found for '${key}'`,
      );
      return result;
    } catch (error) {
      this.logger.error("GetCacheError", error);
      return null;
    }
  }
}
