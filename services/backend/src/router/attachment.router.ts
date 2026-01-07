import {
  AttachmentUsage,
  SignedAttachmentUrlTTL,
  type TAttachment,
  type TAttachmentDTO,
  type TAttachmentUsage,
  type TSignedAttachmentUrl,
  UploadAttachmentPayload,
} from '@budgetbuddyde/api/attachment';
import type {TUserID} from '@budgetbuddyde/api/common';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import multer from 'multer';
import {uuidv7} from 'uuidv7';
import {z} from 'zod';
import {AttachmentSchema} from '../db/schema/types';
import {logger} from '../lib';
import {ApiResponse, HTTPStatusCode} from '../models';
import {AttachmentService} from '../services/attachment.service';
import {getAttachmentPath} from '../utils/getAttachmentPath';

export const attachmentRouter = Router();
const upload = multer({storage: multer.memoryStorage()});
const attachmentLogger = logger.child({label: 'attachment.router'});
const attachmentService = new AttachmentService();

attachmentRouter.get(
  '/',
  validateRequest({
    // TODO: When required, implement a pagination aswell as filtering by a specific transactionId in order to avoid listing all attachments at once
    query: z.object({
      usage: AttachmentUsage,
      ttl: SignedAttachmentUrlTTL.optional(),
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
      const registeredAttachments = await attachmentService.findByOwnerAndUsage(userId, req.query.usage);

      if (registeredAttachments.length === 0) {
        attachmentLogger.warn('No attachments found for user %s with usage %s', userId, req.query.usage);
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.OK)
          .withData({attachments: []})
          .withMessage('No attachments found')
          .withFrom('db')
          .buildAndSend(res);
      }

      const {signedUrls, source} = await attachmentService.generateSignedUrls(
        registeredAttachments.map(({id, location}) => ({
          attachmentId: id as TAttachment['id'],
          objectStoreLocation: location,
        })),
        {
          ttl: req.query.ttl,
        },
      );

      ApiResponse.builder<TAttachmentDTO[]>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Attachments retrieved successfully')
        .withData(
          registeredAttachments.map(attachment => {
            const attachmentId = attachment.id as TAttachment['id'];
            return {
              id: attachmentId,
              ownerId: attachment.ownerId as TUserID,
              usage: attachment.usage as TAttachmentUsage,
              contentType: attachment.contentType,
              fileName: attachment.fileName,
              fileExtension: attachment.fileExtension,
              url: signedUrls.get(attachmentId) as TSignedAttachmentUrl,
              createdAt: attachment.createdAt.toISOString(),
            };
          }),
        )
        .withFrom(source)
        .buildAndSend(res);
    } catch (error) {
      attachmentLogger.error(
        'Failed to retrieve attachments for user %s with usage %s: %s',
        userId,
        req.query.usage,
        error,
      );
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to retrieve attachments')
        .buildAndSend(res);
    }
  },
);

attachmentRouter.get(
  '/:attachmentId',
  validateRequest({
    query: z.object({
      ttl: SignedAttachmentUrlTTL.optional(),
    }),
    params: z.object({
      attachmentId: AttachmentSchema.select.shape.id,
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

      ApiResponse.builder<TAttachmentDTO>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Attachment retrieved successfully')
        .withData({
          id: targetAttachment.id as TAttachmentDTO['id'],
          ownerId: targetAttachment.ownerId as TUserID,
          usage: targetAttachment.usage as TAttachmentUsage,
          contentType: targetAttachment.contentType,
          fileName: targetAttachment.fileName,
          fileExtension: targetAttachment.fileExtension,
          url: signedUrl as TSignedAttachmentUrl,
          createdAt: targetAttachment.createdAt.toISOString(),
        })
        .buildAndSend(res);
    } catch (error) {
      attachmentLogger.error("Couldn't retrieve attachment: ", error);
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to retrieve attachment')
        .buildAndSend(res);
    }
  },
);

attachmentRouter.post(
  '/',
  upload.array('files'),
  validateRequest({
    body: UploadAttachmentPayload,
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      return ApiResponse.builder()
        .withStatus(HTTPStatusCode.UNAUTHORIZED)
        .withMessage('Unauthorized')
        .buildAndSend(res);
    }

    const requestBody = req.body;
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('No files uploaded')
        .buildAndSend(res);
    }

    try {
      const uploadPromises = files.map(async file => {
        const attachmentId = uuidv7();
        const fileExtension = AttachmentService.getFileExtension(file);
        const location = getAttachmentPath(
          requestBody.usage === 'avatar'
            ? {usage: 'avatar', userId, attachmentId, fileExtension}
            : {usage: 'transaction', userId, attachmentId, fileExtension, transactionId: requestBody.transactionId},
        );

        await attachmentService.uploadFile({
          id: attachmentId as TAttachment['id'],
          ownerId: userId as TUserID,
          usage: requestBody.usage as TAttachmentUsage,
          fileName: file.originalname,
          fileExtension,
          contentType: file.mimetype,
          location,
          fileBuffer: file.buffer,
        });

        return {
          attachmentId,
          fileName: file.originalname,
          ownerId: userId,
          usage: requestBody.usage,
          fileExtension,
          mimeType: file.mimetype,
          objectStoreLocation: location,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const {signedUrls} = await attachmentService.generateSignedUrls(
        uploadedFiles.map(file => ({
          attachmentId: file.attachmentId as TAttachment['id'],
          objectStoreLocation: file.objectStoreLocation,
        })),
      );

      ApiResponse.builder<TAttachmentDTO[]>()
        .withStatus(HTTPStatusCode.CREATED)
        .withMessage(`${uploadedFiles.length} files uploaded successfully`)
        .withData(
          uploadedFiles.map(({attachmentId, ownerId, usage, fileName, fileExtension, mimeType}) => {
            const id = attachmentId as TAttachment['id'];
            return {
              id,
              ownerId: ownerId as TUserID,
              usage: usage as TAttachmentUsage,
              contentType: mimeType,
              fileName: fileName,
              fileExtension: fileExtension,
              url: signedUrls.get(id) as TSignedAttachmentUrl,
              createdAt: new Date().toISOString(),
            };
          }),
        )
        .buildAndSend(res);
    } catch (error) {
      attachmentLogger.error("Couldn't process attachments: ", error);
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to upload files')
        .buildAndSend(res);
    }
  },
);

attachmentRouter.delete(
  '/:attachmentId',
  validateRequest({
    params: z.object({
      attachmentId: AttachmentSchema.select.shape.id,
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

    const attachmentIds = [req.params.attachmentId];

    try {
      const deletedCount = await attachmentService.deleteAttachments(userId, attachmentIds);

      if (deletedCount === 0) {
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.BAD_REQUEST)
          .withMessage('No valid attachments to delete')
          .buildAndSend(res);
      }

      ApiResponse.builder().withMessage(`${deletedCount} attachments deleted successfully`).buildAndSend(res);
    } catch (error) {
      attachmentLogger.error("Couldn't delete attachments: ", error);
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to delete attachments')
        .buildAndSend(res);
    }
  },
);
