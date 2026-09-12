import type {TSignedAttachmentUrl} from '@budgetbuddyde/api/attachment';
import {config} from '../../config';
import {Cache} from './cache';

/** Cache signed URLs for slightly less than their actual expiry to avoid serving stale links. */
const SIGNED_URL_CACHE_TTL_MARGIN_SECONDS = 60;

export class AttachmentCache extends Cache {
  constructor() {
    super(config.attachments.cacheNamespace);
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
