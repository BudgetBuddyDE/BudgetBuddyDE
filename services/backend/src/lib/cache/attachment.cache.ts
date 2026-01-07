import type {TSignedAttachmentUrl} from '@budgetbuddyde/api/attachment';
import {Cache} from './cache';

export class AttachmentCache extends Cache {
  constructor() {
    super('attachments');
  }

  writeSignedAttachmentUrl(attachmentId: string, signedUrl: string, ttlSeconds: number) {
    return this.setValue(attachmentId, signedUrl, {ttl: ttlSeconds});
  }

  retrieveSignedAttachmentUrl(attachmentId: string) {
    return this.getValue<TSignedAttachmentUrl>(attachmentId);
  }

  deleteSignedAttachmentUrl(attachmentId: string) {
    return this.deleteValue(attachmentId);
  }
}
