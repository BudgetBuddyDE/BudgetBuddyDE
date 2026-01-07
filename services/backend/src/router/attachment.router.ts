import path from 'node:path';
import {DeleteObjectsCommand, GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {Transaction} from '@budgetbuddyde/api/transaction';
import {and, eq, inArray} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import multer from 'multer';
import {uuidv7} from 'uuidv7';
import {z} from 'zod';
import {db} from '../db';
import {attachments} from '../db/schema';
import {AttachmentSchema} from '../db/schema/types';
import {logger} from '../lib';
import {AttachmentCache} from '../lib/cache';
import {getS3Client} from '../lib/s3';
import {ApiResponse, HTTPStatusCode} from '../models';
import {getAttachmentPath} from '../utils/getAttachmentPath';

export const attachmentRouter = Router();
const upload = multer({storage: multer.memoryStorage()});
const attachmentLogger = logger.child({label: 'attachments'});

/**
 * Helper function to get file extension from multer file
 */
const getFileExtension = (file: Express.Multer.File) => path.extname(file.originalname).slice(1).toLowerCase();

attachmentRouter.get(
  '/',
  validateRequest({
    // TODO: When required, implement a pagination aswell as filtering by a specific transactionId in order to avoid listing all attachments at once
    query: z.object({
      usage: z.enum(['avatar', 'transaction']),
      ttl: z.coerce.number().min(60).max(3600).optional(), // time to live for signed URL in seconds
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
      attachmentLogger.debug('Fetching attachments for user %s with usage %s', userId, req.query.usage);
      const registeredAttachments = await db.query.attachments.findMany({
        where() {
          return and(eq(attachments.ownerId, userId), eq(attachments.usage, req.query.usage));
        },
      });

      if (registeredAttachments.length === 0) {
        attachmentLogger.warn('No attachments found for user %s with usage %s', userId, req.query.usage);
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.OK)
          .withData({attachments: []})
          .withMessage('No attachments found')
          .withFrom('db')
          .buildAndSend(res);
      }

      attachmentLogger.debug(
        'Found %d attachments for user %s with usage %s',
        registeredAttachments.length,
        userId,
        req.query.usage,
      );

      const attachmentCache = new AttachmentCache();
      const signedUrlTtlInSeconds = req.query.ttl || 900;

      // Check cache for all attachments in parallel
      const cachedResults = await Promise.all(
        registeredAttachments.map(async attachment => ({
          attachment,
          cachedUrl: await attachmentCache.retrieveSignedAttachmentUrl(attachment.id),
        })),
      );

      // Separate cached from non-cached attachments
      const attachmentsWithCache: Array<{attachment: (typeof registeredAttachments)[0]; url: string}> = [];
      const attachmentsToGenerate: typeof registeredAttachments = [];

      for (const {attachment, cachedUrl} of cachedResults) {
        if (cachedUrl) {
          attachmentsWithCache.push({attachment, url: cachedUrl});
        } else {
          attachmentsToGenerate.push(attachment);
        }
      }

      attachmentLogger.debug(
        'Cache status: %d/%d URLs cached, %d to generate (user: %s)',
        attachmentsWithCache.length,
        registeredAttachments.length,
        attachmentsToGenerate.length,
        userId,
      );

      // If all URLs are cached, return early
      if (attachmentsToGenerate.length === 0) {
        attachmentLogger.info(
          'Retrieved %d attachments entirely from cache (user: %s, usage: %s, ttl: %ds)',
          attachmentsWithCache.length,
          userId,
          req.query.usage,
          signedUrlTtlInSeconds,
        );
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.OK)
          .withMessage('Attachments retrieved successfully')
          .withData({attachments: attachmentsWithCache.map(a => a.url)})
          .withFrom('cache')
          .buildAndSend(res);
      }

      // Generate signed URLs only for non-cached attachments
      const s3Client = getS3Client();
      attachmentLogger.debug('Generating %d signed URLs from S3', attachmentsToGenerate.length);
      const newlyGeneratedResults = await Promise.all(
        attachmentsToGenerate.map(async attachment => {
          const signedUrl = await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: attachment.location,
            }),
            {expiresIn: signedUrlTtlInSeconds},
          );
          return {attachment, url: signedUrl};
        }),
      );

      // Cache newly generated URLs in parallel
      await Promise.all(
        newlyGeneratedResults.map(({attachment, url}) =>
          attachmentCache.writeSignedAttachmentUrl(attachment.id, url, signedUrlTtlInSeconds),
        ),
      );

      attachmentLogger.debug('Successfully cached %d newly generated signed URLs', newlyGeneratedResults.length);

      // Combine all URLs maintaining original order
      const urlMap = new Map<string, string>();
      for (const {attachment, url} of [...attachmentsWithCache, ...newlyGeneratedResults]) {
        urlMap.set(attachment.id, url);
      }
      const allSignedUrls = registeredAttachments.map(attachment => urlMap.get(attachment.id) as string);

      const responseFrom =
        attachmentsWithCache.length > 0 && newlyGeneratedResults.length > 0
          ? undefined // "mixed" source (therefore omit the field)
          : attachmentsWithCache.length > 0
            ? 'cache'
            : 'object_store';

      attachmentLogger.info(
        'Successfully retrieved %d attachments (%d cached, %d generated) for user %s with usage %s and ttl %ds',
        registeredAttachments.length,
        attachmentsWithCache.length,
        newlyGeneratedResults.length,
        userId,
        req.query.usage,
        signedUrlTtlInSeconds,
      );

      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Attachments retrieved successfully')
        .withData({attachments: allSignedUrls})
        .withFrom(responseFrom)
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
      ttl: z.coerce.number().min(60).max(3600).optional(), // time to live for signed URL in seconds
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

    // const attachmentIds = [req.params.attachmentId];
    const attachmentId = req.params.attachmentId;
    const targetAttachments = await db.query.attachments.findFirst({
      where() {
        return and(
          // Filtering by owner ensures only user's own attachments are accessed
          eq(attachments.ownerId, userId),
          // as of now, only single retrieval is supported via URL param
          eq(attachments.id, attachmentId),
          // inArray(attachments.id, attachmentIds),
        );
      },
    });

    if (!targetAttachments) {
      return ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage('Attachment not found')
        .buildAndSend(res);
    }

    // Keep the call to cache AFTER confirming the attachment exists in DB and is owned by the requesting user
    const attachmentCache = new AttachmentCache();
    const cachedSignedUrl = await attachmentCache.retrieveSignedAttachmentUrl(attachmentId);
    if (cachedSignedUrl) {
      logger.debug('Serving signed URL for attachment %s from cache', attachmentId);
      return ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Attachment retrieved successfully')
        .withData({attachment: cachedSignedUrl})
        .withFrom('cache')
        .buildAndSend(res);
    }

    const s3Client = getS3Client();
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: targetAttachments.location,
      });

      const signedUrlTtlInSeconds = req.query.ttl || 900;
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: signedUrlTtlInSeconds,
      });
      await attachmentCache.writeSignedAttachmentUrl(attachmentId, signedUrl, signedUrlTtlInSeconds);
      logger.debug(
        'Generated signed URL for attachment %s and cached the URL with TTL %d',
        attachmentId,
        signedUrlTtlInSeconds,
      );

      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Attachment retrieved successfully')
        .withData({signedUrl})
        .withFrom('object_store')
        .buildAndSend(res);
    } catch (error) {
      logger.error("Couldn't retrieve attachment: ", error);
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to retrieve attachment')
        .buildAndSend(res);
    }
  },
);

const AttachmentRouterUploadPayload = z.discriminatedUnion('usage', [
  z.object({usage: z.literal('avatar')}),
  z.object({usage: z.literal('transaction'), transactionId: Transaction.shape.id}),
]);

attachmentRouter.post(
  '/',
  upload.array('files'),
  validateRequest({
    body: AttachmentRouterUploadPayload,
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

    const s3Client = getS3Client();

    try {
      const uploadPromises = files.map(async file => {
        const attachmentId = uuidv7();
        const fileExtension = getFileExtension(file);
        const fileMetadata: {
          attachmentId: string;
          ownerId: string;
          usage: 'avatar' | 'transaction';
          objectStoreLocation: string;
          fileName: string;
          fileExtension: string;
          mimeType: string;
        } = {
          attachmentId: attachmentId,
          fileName: file.originalname,
          ownerId: userId,
          usage: requestBody.usage,
          fileExtension: fileExtension,
          mimeType: file.mimetype,
          objectStoreLocation: getAttachmentPath(
            requestBody.usage === 'avatar'
              ? {usage: 'avatar', userId, attachmentId, fileExtension}
              : {usage: 'transaction', userId, attachmentId, fileExtension, transactionId: requestBody.transactionId},
          ),
        };

        await db
          .insert(attachments)
          .values([
            {
              id: fileMetadata.attachmentId,
              ownerId: fileMetadata.ownerId,
              usage: fileMetadata.usage,
              fileName: fileMetadata.fileName,
              fileExtension: fileMetadata.fileExtension,
              contentType: fileMetadata.mimeType,
              location: fileMetadata.objectStoreLocation,
            },
          ])
          .returning();
        attachmentLogger.debug('Inserted attachment metadata into database', {attachmentId: fileMetadata.attachmentId});

        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: fileMetadata.objectStoreLocation,
          Body: file.buffer,
          ContentType: fileMetadata.fileExtension,
        });

        attachmentLogger.debug(
          `Uploading file %s to S3 at %s`,
          fileMetadata.attachmentId,
          fileMetadata.objectStoreLocation,
        );
        await s3Client.send(command);

        attachmentLogger.info('File uploaded successfully', {attachmentId: fileMetadata.attachmentId});
        return fileMetadata;
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      ApiResponse.builder()
        .withStatus(HTTPStatusCode.CREATED)
        .withMessage(`${uploadedFiles.length} files uploaded successfully`)
        .withData(uploadedFiles)
        .buildAndSend(res);
    } catch (error) {
      logger.error("Couldn't process attachments: ", error);
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
    if (!attachmentIds || !Array.isArray(attachmentIds) || attachmentIds.length === 0) {
      return ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('List of attachment IDs is required')
        .buildAndSend(res);
    }

    const s3Client = getS3Client();
    const targetAttachments = await db.query.attachments.findMany({
      where() {
        return and(
          eq(attachments.ownerId, userId),
          // as of now, only single deletion is supported via URL param
          inArray(attachments.id, attachmentIds),
        );
      },
    });
    const objectsToDelete: {Key: string}[] = targetAttachments.map(({location}) => {
      return {Key: location};
    });
    try {
      if (objectsToDelete.length === 0) {
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.BAD_REQUEST)
          .withMessage('No valid attachments to delete')
          .buildAndSend(res);
      }

      const command = new DeleteObjectsCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Delete: {
          Objects: objectsToDelete,
        },
      });

      await s3Client.send(command);
      attachmentLogger.debug('Deleted %d attachments from S3', objectsToDelete.length);

      await db.delete(attachments).where(and(eq(attachments.ownerId, userId), inArray(attachments.id, attachmentIds)));
      attachmentLogger.info('Deleted %d attachment entries from database for user %s', attachmentIds.length, userId);

      ApiResponse.builder().withMessage(`${objectsToDelete.length} attachments deleted successfully`).buildAndSend(res);
    } catch (error) {
      logger.error("Couldn't delete attachments: ", error);
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to delete attachments')
        .buildAndSend(res);
    }
  },
);
