import type {TSignedAttachmentUrl} from '@budgetbuddyde/api/attachment';
import type {Logger} from '@budgetbuddyde/logger';
import type Redis from 'ioredis';
import {config} from '../../config';
import {getRedisClient} from '../../db/redis';
import {logger} from '../logger';

/** Cache signed URLs for slightly less than their actual expiry to avoid serving stale links. */
const SIGNED_URL_CACHE_TTL_MARGIN_SECONDS = 60;

/** Redis-backed cache that degrades to a no-op when Redis is not configured. */
export class AttachmentCache {
  private readonly logger: Logger;
  private readonly redisClient: Redis | null;
  private readonly namespace: string;

  constructor() {
    this.logger = logger.child({module: 'Cache'});
    this.redisClient = config.redis.url ? getRedisClient() : null;
    this.namespace = config.attachments.cacheNamespace;
  }

  private getKey(key: string): `${string}:${string}` {
    return `${this.namespace}:${key}`;
  }

  private async setValue(key: string, value: string, options?: {ttl: number}) {
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

  private async getValue<Result extends string = string>(key: string) {
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

  private async deleteValue(key: string) {
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

  private cacheTtl(ttlSeconds: number): number {
    return Math.max(1, ttlSeconds - SIGNED_URL_CACHE_TTL_MARGIN_SECONDS);
  }

  writeSignedAttachmentUrl(attachmentId: string, signedUrl: string, ttlSeconds: number) {
    return this.setValue(attachmentId, signedUrl, {ttl: this.cacheTtl(ttlSeconds)});
  }

  retrieveSignedAttachmentUrl(attachmentId: string) {
    return this.getValue<TSignedAttachmentUrl>(attachmentId);
  }

  deleteSignedAttachmentUrl(attachmentId: string) {
    return this.deleteValue(attachmentId);
  }

  /** Bulk read for the default signed-URL cache keys. */
  async retrieveSignedAttachmentUrls(attachmentIds: readonly string[]): Promise<Map<string, string>> {
    if (!this.redisClient || attachmentIds.length === 0) return new Map();
    try {
      const values = await this.redisClient.mget(...attachmentIds.map(attachmentId => this.getKey(attachmentId)));
      const result = new Map<string, string>();
      values.forEach((value, index) => {
        const attachmentId = attachmentIds[index];
        if (value !== null && attachmentId !== undefined) result.set(attachmentId, value);
      });
      return result;
    } catch (error) {
      this.logger.error('GetCacheError', error instanceof Error ? error : new Error(String(error)));
      return new Map();
    }
  }

  /** Bulk write for the default signed-URL cache keys using a single pipeline. */
  async writeSignedAttachmentUrls(
    entries: readonly {attachmentId: string; signedUrl: string; ttlSeconds: number}[],
  ): Promise<void> {
    if (!this.redisClient || entries.length === 0) return;
    try {
      const pipeline = this.redisClient.pipeline();
      for (const entry of entries) {
        pipeline.set(this.getKey(entry.attachmentId), entry.signedUrl, 'EX', this.cacheTtl(entry.ttlSeconds));
      }
      await pipeline.exec();
    } catch (error) {
      this.logger.error('SetCacheError', error instanceof Error ? error : new Error(String(error)));
    }
  }
}
