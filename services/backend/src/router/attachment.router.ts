import {AttachmentSchemas} from '@budgetbuddyde/db/backend';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {z} from 'zod';
import {config} from '../config';
import {getAttachment, attachmentQuerySchema} from '../domain/attachment';
import {executeDomain} from '../domain/response';
import {logger} from '../lib';
import {TransactionAttachmentHandler} from '../lib/attachment';
import {ApiResponse, HTTPStatusCode} from '../models';

export const attachmentRouter = Router();
const attachmentLogger = logger.child({module: 'attachment.router'});
let attachmentService: TransactionAttachmentHandler | undefined;

function getAttachmentService(): TransactionAttachmentHandler {
  attachmentService ??= new TransactionAttachmentHandler(config.getRequiredObjectStorageConfig().bucketName);
  return attachmentService;
}

/**
 * GET /api/attachment/:attachmentId
 * Retrieve a single attachment by ID with a signed URL.
 */
attachmentRouter.get(
  '/:attachmentId',
  validateRequest({
    query: attachmentQuerySchema,
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

    await executeDomain(res, () => getAttachment(userId, req.params.attachmentId, req.query));
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
      const deletedCount = await getAttachmentService().deleteAttachments(userId, [req.params.attachmentId]);

      if (deletedCount === 0) {
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.NOT_FOUND)
          .withMessage('Attachment not found or not owned by user')
          .buildAndSend(res);
      }

      ApiResponse.builder().withMessage('Attachment deleted successfully').buildAndSend(res);
    } catch (error) {
      attachmentLogger.error("Couldn't delete attachment", error instanceof Error ? error : new Error(String(error)));
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to delete attachment')
        .buildAndSend(res);
    }
  },
);
