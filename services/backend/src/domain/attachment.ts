import type {TUserID} from '@budgetbuddyde/api';
import {SignedAttachmentUrlTTL, type TAttachment, type TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {AttachmentSchemas} from '@budgetbuddyde/db/backend';
import z from 'zod';
import {config} from '../config';
import {logger} from '../lib';
import {TransactionAttachmentHandler} from '../lib/attachment';
import {ApiResponse, HTTPStatusCode} from '../models';
const attachmentLogger = logger.child({module: 'attachment.router'});
let attachmentService: TransactionAttachmentHandler | undefined;
function getAttachmentService(): TransactionAttachmentHandler {
  attachmentService ??= new TransactionAttachmentHandler(config.getRequiredObjectStorageConfig().bucketName);
  return attachmentService;
}
export const attachmentQuerySchema = z.object({ttl: SignedAttachmentUrlTTL.optional()});

export async function getAttachment(
  userId: string,
  entityIdInput: string,
  input: z.input<typeof attachmentQuerySchema> = {},
) {
  AttachmentSchemas.select.shape.id.parse(entityIdInput);
  const parsedInput = attachmentQuerySchema.parse(input);

  try {
    const attachmentId = entityIdInput;
    const targetAttachment = await getAttachmentService().verifyOwnership(attachmentId, userId);

    if (!targetAttachment) {
      return ApiResponse.builder().withStatus(HTTPStatusCode.NOT_FOUND).withMessage('Attachment not found').build();
    }

    const signedUrl = await getAttachmentService().generateSignedUrl(targetAttachment, {ttl: parsedInput.ttl});

    return ApiResponse.builder<TAttachmentWithUrl>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Attachment retrieved successfully')
      .withData({
        id: targetAttachment.id as TAttachment['id'],
        ownerId: targetAttachment.ownerId as TUserID,
        fileName: targetAttachment.fileName,
        fileExtension: targetAttachment.fileExtension,
        contentType: targetAttachment.contentType as TAttachmentWithUrl['contentType'],
        location: targetAttachment.location,
        signedUrl: signedUrl as TAttachmentWithUrl['signedUrl'],
        createdAt: targetAttachment.createdAt.toISOString(),
      })
      .build();
  } catch (error) {
    attachmentLogger.error("Couldn't retrieve attachment", error instanceof Error ? error : new Error(String(error)));
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
      .withMessage('Failed to retrieve attachment')
      .build();
  }
}
