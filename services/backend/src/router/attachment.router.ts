import type {TUserID} from '@budgetbuddyde/api';
import {SignedAttachmentUrlTTL, type TAttachment, type TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {AttachmentSchemas} from '@budgetbuddyde/db/backend';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {z} from 'zod';
import {logger} from '../lib';
import {TransactionAttachmentHandler} from '../lib/attachment';
import {ApiResponse, HTTPStatusCode} from '../models';

export const attachmentRouter = Router();
const attachmentLogger = logger.child({label: 'attachment.router'});
const attachmentService = new TransactionAttachmentHandler(process.env.AWS_S3_BUCKET_NAME as string);

/**
 * GET /api/attachment/:attachmentId
 * Retrieve a single attachment by ID with a signed URL.
 */
attachmentRouter.get(
  '/:attachmentId',
  validateRequest({
    query: z.object({
      ttl: SignedAttachmentUrlTTL.optional(),
    }),
    params: z.object({
      attachmentId: AttachmentSchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      return ApiResponse.builder()
        .withStatus(HTTPStatusCode.UNAUTHORIZED)
        .withMessage('Unauthorized')
        .buildAndSend(res);
    }

    try {
      const attachmentId = req.params.attachmentId;
      const targetAttachment = await attachmentService.verifyOwnership(attachmentId, userId);

      if (!targetAttachment) {
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.NOT_FOUND)
          .withMessage('Attachment not found')
          .buildAndSend(res);
      }

      const signedUrl = await attachmentService.generateSignedUrl(targetAttachment, {ttl: req.query.ttl});

      ApiResponse.builder<TAttachmentWithUrl>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Attachment retrieved successfully')
        .withData({
          id: targetAttachment.id as TAttachment['id'],
          ownerId: targetAttachment.ownerId as TUserID,
          fileName: targetAttachment.fileName,
          fileExtension: targetAttachment.fileExtension,
          contentType: targetAttachment.contentType,
          location: targetAttachment.location,
          signedUrl: signedUrl as TAttachmentWithUrl['signedUrl'],
          createdAt: targetAttachment.createdAt.toISOString(),
        })
        .buildAndSend(res);
    } catch (error) {
      attachmentLogger.error("Couldn't retrieve attachment: %o", error);
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to retrieve attachment')
        .buildAndSend(res);
    }
  },
);

/**
 * DELETE /api/attachment/:attachmentId
 * Delete a single attachment by ID.
 */
attachmentRouter.delete(
  '/:attachmentId',
  validateRequest({
    params: z.object({
      attachmentId: AttachmentSchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      return ApiResponse.builder()
        .withStatus(HTTPStatusCode.UNAUTHORIZED)
        .withMessage('Unauthorized')
        .buildAndSend(res);
    }

    try {
      const deletedCount = await attachmentService.deleteAttachments(userId, [req.params.attachmentId]);

      if (deletedCount === 0) {
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.NOT_FOUND)
          .withMessage('Attachment not found or not owned by user')
          .buildAndSend(res);
      }

      ApiResponse.builder().withMessage('Attachment deleted successfully').buildAndSend(res);
    } catch (error) {
      attachmentLogger.error("Couldn't delete attachment: %o", error);
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to delete attachment')
        .buildAndSend(res);
    }
  },
);
