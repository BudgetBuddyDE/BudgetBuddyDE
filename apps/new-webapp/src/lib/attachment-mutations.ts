import type {TAttachment, TAttachmentWithUrl, TGetAttachmentsQuery} from '@budgetbuddyde/api/attachment';
import {apiClient} from '@/apiClient';

export const attachmentLimits = {
  maxFiles: 10,
  maxBytes: 20 * 1024 * 1024,
  contentTypes: ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'],
} as const;

export function validateAttachmentFiles(files: File[]): string | undefined {
  if (!files.length) return 'Choose at least one image.';
  if (files.length > attachmentLimits.maxFiles) return `Choose at most ${attachmentLimits.maxFiles} files.`;
  if (
    files.some(
      file => !attachmentLimits.contentTypes.includes(file.type as (typeof attachmentLimits.contentTypes)[number]),
    )
  )
    return 'Only PNG, JPEG, WebP, HEIC, and HEIF images are supported.';
  if (files.some(file => file.size > attachmentLimits.maxBytes)) return 'Each file must be 20 MB or smaller.';
  return undefined;
}

export async function loadTransactionAttachments(
  transactionId: string,
): Promise<{attachments: TAttachmentWithUrl[]; error?: string}> {
  const [response, error] = await apiClient.backend.transaction.getTransactionAttachments(transactionId, {
    ttl: 300 as TGetAttachmentsQuery['ttl'],
  });
  return {attachments: response?.data ?? [], error: error ? 'Attachments could not be loaded.' : undefined};
}

export async function uploadTransactionAttachments(
  transactionId: string,
  files: File[],
): Promise<{attachments: TAttachmentWithUrl[]; error?: string}> {
  const validation = validateAttachmentFiles(files);
  if (validation) return {attachments: [], error: validation};
  const [response, error] = await apiClient.backend.transaction.uploadTransactionAttachments(transactionId, files);
  return {attachments: response?.data ?? [], error: error ? 'Attachments could not be uploaded.' : undefined};
}

export async function deleteTransactionAttachment(transactionId: string, attachmentId: string): Promise<boolean> {
  const [, error] = await apiClient.backend.transaction.deleteTransactionAttachments(transactionId, {
    attachmentIds: [attachmentId],
  });
  return !error;
}

export async function deleteAttachment(attachmentId: TAttachment['id']): Promise<boolean> {
  const [, error] = await apiClient.backend.attachment.deleteById(attachmentId);
  return !error;
}
