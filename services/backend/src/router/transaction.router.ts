import type {TUserID} from '@budgetbuddyde/api';
import {SignedAttachmentUrlTTL, type TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {TransactionSchemas, transactionReceiverView, transactions} from '@budgetbuddyde/db/backend';
import {and, eq} from 'drizzle-orm';
import {Router, type NextFunction, type Request, type RequestHandler, type Response} from 'express';
import validateRequest from 'express-zod-safe';
import multer from 'multer';
import z from 'zod';
import {config} from '../config';
import {db} from '../db';
import {executeDomain} from '../domain/response';
import {logger} from '../lib';
import {ApiResponse, HTTPStatusCode} from '../models';
import {applyBatchUpdates, createBatchSchema, hasAllOwnedIds, ownedIdsFinder, updateBatchSchema} from './batch';
import {
  createTransaction,
  getTransaction,
  listTransactions,
  listTransactionAttachments,
  updateTransaction,
  removeTransaction,
  transactionListSchema,
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionAttachmentsQuerySchema,
} from '../domain/transaction';
import {TransactionAttachmentHandler} from '../lib/attachment';

export const transactionRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: config.attachments.upload.maxFilesPerRequest,
    fileSize: config.attachments.upload.maxFileSizeBytes,
  },
});

const enforceUploadRequestSize = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = Number(req.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > config.attachments.upload.maxRequestSizeBytes) {
    ApiResponse.builder()
      .withStatus(HTTPStatusCode.PAYLOAD_TOO_LARGE)
      .withMessage('Upload exceeds the maximum request size')
      .buildAndSend(res);
    return;
  }
  next();
};

const verifyUploadedFilesSize = (req: Request, res: Response, next: NextFunction): void => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const totalSize = files.reduce((total, file) => total + file.size, 0);
  if (totalSize > config.attachments.upload.maxRequestSizeBytes) {
    ApiResponse.builder()
      .withStatus(HTTPStatusCode.PAYLOAD_TOO_LARGE)
      .withMessage('Upload exceeds the maximum request size')
      .buildAndSend(res);
    return;
  }
  next();
};

const uploadTransactionFiles: RequestHandler[] = [
  enforceUploadRequestSize,
  upload.array('files', config.attachments.upload.maxFilesPerRequest),
  verifyUploadedFilesSize,
];
const attachmentLogger = logger.child({module: 'transactions.attachments'});
let attachmentService: TransactionAttachmentHandler | undefined;

function getAttachmentService(): TransactionAttachmentHandler {
  attachmentService ??= new TransactionAttachmentHandler(config.getRequiredObjectStorageConfig().bucketName);
  return attachmentService;
}

const isAllowedAttachmentFile = (file: Express.Multer.File): boolean => {
  const isAllowed =
    config.attachments.allowedContentTypes.has(file.mimetype) ||
    (file.mimetype === 'application/octet-stream' &&
      config.attachments.octetStreamAllowedExtensions.has(file.originalname.split('.').pop()?.toLowerCase() ?? ''));
  return (
    isAllowed &&
    TransactionAttachmentHandler.hasValidImageSignature(file.buffer, TransactionAttachmentHandler.resolveMimeType(file))
  );
};

const mapAttachmentWithUrl = (attachment: {
  id: string;
  ownerId: string;
  fileName: string;
  fileExtension: string;
  contentType: string;
  location: string;
  createdAt: Date;
  signedUrl: TAttachmentWithUrl['signedUrl'];
}): TAttachmentWithUrl => ({
  id: attachment.id as TAttachmentWithUrl['id'],
  ownerId: attachment.ownerId as TUserID,
  fileName: attachment.fileName,
  fileExtension: attachment.fileExtension,
  contentType: attachment.contentType as TAttachmentWithUrl['contentType'],
  location: attachment.location,
  signedUrl: attachment.signedUrl,
  createdAt: attachment.createdAt.toISOString(),
});

transactionRouter.get('/receiver', async (req, res) => {
  const userId = req.context.user?.id;
  if (!userId) {
    ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
    return;
  }

  const records = await db
    .select({receiver: transactionReceiverView.receiver})
    .from(transactionReceiverView)
    .where(eq(transactionReceiverView.ownerId, userId));

  ApiResponse.builder<typeof records>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage("Fetched user's receivers successfully")
    .withData(records)
    .withFrom('db')
    .buildAndSend(res);
});

transactionRouter.get(
  '/',
  validateRequest({
    query: transactionListSchema,
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    await executeDomain(res, () => listTransactions(userId, req.query));
  },
);

transactionRouter.get(
  '/attachments',
  validateRequest({
    query: z.object({
      from: z.coerce.number().optional(),
      to: z.coerce.number().optional(),
      ttl: SignedAttachmentUrlTTL.optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    try {
      const {attachments: foundAttachments, totalCount} =
        await getAttachmentService().findTransactionAttachmentsByOwner(userId, {
          from: req.query.from,
          to: req.query.to,
          ttl: req.query.ttl,
        });

      ApiResponse.builder<TAttachmentWithUrl[]>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage("Fetched user's transaction attachments successfully")
        .withTotalCount(totalCount)
        .withData(foundAttachments.map(a => mapAttachmentWithUrl(a)))
        .buildAndSend(res);
    } catch (err) {
      attachmentLogger.error(
        "Couldn't fetch transaction attachments",
        err instanceof Error ? err : new Error(String(err)),
      );
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

transactionRouter.get(
  '/:id',
  validateRequest({
    params: z.object({
      id: TransactionSchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    await executeDomain(res, () => getTransaction(userId, req.params.id));
  },
);

transactionRouter.get(
  '/:id/attachments',
  validateRequest({
    params: z.object({
      id: TransactionSchemas.select.shape.id,
    }),
    query: transactionAttachmentsQuerySchema,
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    await executeDomain(res, () => listTransactionAttachments(userId, req.params.id, req.query));
  },
);

transactionRouter.post(
  '/',
  validateRequest({
    body: transactionCreateSchema,
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    await executeDomain(res, () => createTransaction(userId, req.body));
  },
);

transactionRouter.post(
  '/batch',
  validateRequest({
    body: createBatchSchema(
      TransactionSchemas.insert.omit({ownerId: true, processedAt: true}).extend({processedAt: z.coerce.date()}),
    ),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const categoryIds = [...new Set(req.body.map(body => body.categoryId))];
    const paymentMethodIds = [...new Set(req.body.map(body => body.paymentMethodId))];
    const [categoriesOwned, paymentMethodsOwned] = await Promise.all([
      hasAllOwnedIds(userId, categoryIds, ownedIdsFinder(db.query.categories)),
      hasAllOwnedIds(userId, paymentMethodIds, ownedIdsFinder(db.query.paymentMethods)),
    ]);
    if (!categoriesOwned || !paymentMethodsOwned) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('One or more referenced categories or payment methods are invalid')
        .buildAndSend(res);
      return;
    }

    try {
      const createdRecords = await db.transaction(async tx => {
        const records = await tx
          .insert(transactions)
          .values(req.body.map(body => ({...body, ownerId: userId})))
          .returning();
        if (records.length !== req.body.length)
          throw new Error('Batch transaction create returned an unexpected row count');
        return records;
      });
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Transactions created successfully')
        .withData(createdRecords)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

transactionRouter.put(
  '/batch',
  validateRequest({
    body: updateBatchSchema(
      TransactionSchemas.select.shape.id,
      TransactionSchemas.update
        .omit({ownerId: true, id: true, createdAt: true, updatedAt: true, processedAt: true})
        .extend({processedAt: z.coerce.date().optional()}),
    ),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const updates = req.body.updates as Array<{id: string; data: z.infer<typeof TransactionSchemas.update>}>;
    const ids = updates.map(update => update.id);
    const categoryIds = [
      ...new Set(updates.flatMap(update => (update.data.categoryId ? [update.data.categoryId] : []))),
    ];
    const paymentMethodIds = [
      ...new Set(updates.flatMap(update => (update.data.paymentMethodId ? [update.data.paymentMethodId] : []))),
    ];
    const [owned, categoriesOwned, paymentMethodsOwned] = await Promise.all([
      hasAllOwnedIds(userId, ids, ownedIdsFinder(db.query.transactions)),
      hasAllOwnedIds(userId, categoryIds, ownedIdsFinder(db.query.categories)),
      hasAllOwnedIds(userId, paymentMethodIds, ownedIdsFinder(db.query.paymentMethods)),
    ]);
    if (!owned) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage('One or more transactions were not found')
        .buildAndSend(res);
      return;
    }
    if (!categoriesOwned || !paymentMethodsOwned) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('One or more referenced categories or payment methods are invalid')
        .buildAndSend(res);
      return;
    }

    try {
      const updatedRecords = await db.transaction(tx =>
        applyBatchUpdates(
          tx,
          updates,
          async (transaction, update) => {
            const [record] = await transaction
              .update(transactions)
              .set({...update.data, ownerId: userId})
              .where(and(eq(transactions.ownerId, userId), eq(transactions.id, update.id)))
              .returning();
            return record;
          },
          update => `Transaction ${update.id} could not be updated`,
        ),
      );
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Transactions updated successfully')
        .withData(updatedRecords)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

transactionRouter.post(
  '/:id/attachments',
  ...uploadTransactionFiles,
  validateRequest({
    params: z.object({
      id: TransactionSchemas.select.shape.id,
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

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('No files uploaded')
        .buildAndSend(res);
    }

    const invalidFiles = files.filter(file => !isAllowedAttachmentFile(file));
    if (invalidFiles.length > 0) {
      return ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('Unsupported attachment file type')
        .buildAndSend(res);
    }

    const transaction = await db.query.transactions.findFirst({
      columns: {id: true},
      where(fields, operators) {
        return operators.and(operators.eq(fields.ownerId, userId), operators.eq(fields.id, req.params.id));
      },
    });
    if (!transaction) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage(`Transaction ${req.params.id} not found`)
        .withFrom('db')
        .buildAndSend(res);
      return;
    }

    try {
      const transactionId = req.params.id as string;
      const uploadedAttachments = await getAttachmentService().uploadTransactionAttachments(
        userId,
        transactionId,
        files,
      );

      ApiResponse.builder<TAttachmentWithUrl[]>()
        .withStatus(HTTPStatusCode.CREATED)
        .withMessage(`${uploadedAttachments.length} attachment(s) uploaded successfully`)
        .withData(uploadedAttachments.map(a => mapAttachmentWithUrl(a)))
        .buildAndSend(res);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      attachmentLogger.error("Couldn't process attachments for transaction %s", req.params.id, error);
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
        .withMessage('Failed to upload files')
        .buildAndSend(res);
    }
  },
);

transactionRouter.put(
  '/:id',
  validateRequest({
    params: z.object({
      id: TransactionSchemas.select.shape.id,
    }),
    body: transactionUpdateSchema,
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    await executeDomain(res, () => updateTransaction(userId, req.params.id, req.body));
  },
);

transactionRouter.delete(
  '/:id',
  validateRequest({
    params: z.object({
      id: TransactionSchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    await executeDomain(res, () => removeTransaction(userId, req.params.id));
  },
);

transactionRouter.delete(
  '/:id/attachments',
  validateRequest({
    params: z.object({
      id: TransactionSchemas.select.shape.id,
    }),
    body: z
      .object({
        attachmentIds: z.array(z.string().uuid()).optional(),
      })
      .optional(),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    try {
      const transactionId = req.params.id;
      const attachmentIds = req.body?.attachmentIds;
      const deletedCount = await getAttachmentService().deleteTransactionAttachments(
        userId,
        transactionId,
        attachmentIds,
      );

      if (deletedCount === 0) {
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.NOT_FOUND)
          .withMessage('No attachments found to delete')
          .buildAndSend(res);
      }

      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage(`${deletedCount} attachment(s) deleted successfully`)
        .buildAndSend(res);
    } catch (err) {
      attachmentLogger.error(
        "Couldn't delete attachments for transaction %s",
        req.params.id,
        err instanceof Error ? err : new Error(String(err)),
      );
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);
