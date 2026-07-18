import type {TUserID} from '@budgetbuddyde/api';
import {SignedAttachmentUrlTTL, type TAttachment, type TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {Category} from '@budgetbuddyde/api/category';
import {PaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {
  attachments,
  TransactionSchemas,
  transactionAttachments,
  transactionReceiverView,
  transactions,
} from '@budgetbuddyde/db/backend';
import {toZonedTime} from 'date-fns-tz';
import {and, desc, eq, inArray, sql} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import multer from 'multer';
import z from 'zod';
import {config, getRequiredObjectStorageConfig} from '../config';
import {db} from '../db';
import {logger} from '../lib';
import {TransactionAttachmentHandler} from '../lib/attachment';
import {ApiResponse, HTTPStatusCode} from '../models';
import {assembleFilter, type TAdditionalFilter} from './assembleFilter';
import {applyBatchUpdates, createBatchSchema, hasAllOwnedIds, updateBatchSchema} from './batch';

export const transactionRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: config.attachments.upload.maxFilesPerRequest,
    fileSize: config.attachments.upload.maxFileSizeBytes,
  },
});
const attachmentLogger = logger.child({label: 'transactions.attachments'});
const attachmentService = new TransactionAttachmentHandler(getRequiredObjectStorageConfig().bucketName);

const isAllowedAttachmentFile = (file: Express.Multer.File): boolean => {
  if (config.attachments.allowedContentTypes.has(file.mimetype)) return true;
  if (file.mimetype === 'application/octet-stream') {
    const extension = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    return config.attachments.octetStreamAllowedExtensions.has(extension);
  }
  return false;
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
    query: z.object({
      search: z.string().optional(),
      from: z.coerce.number().optional(),
      to: z.coerce.number().optional(),
      $dateFrom: z.coerce.date().optional(),
      $dateTo: z.coerce.date().optional(),
      $categories: z
        .array(Category.shape.id)
        .or(Category.shape.id)
        .transform(value => (Array.isArray(value) ? value : [value]))
        .optional(),
      $excl_categories: z
        .array(Category.shape.id)
        .or(Category.shape.id)
        .transform(value => (Array.isArray(value) ? value : [value]))
        .optional(),
      $paymentMethods: z
        .array(PaymentMethod.shape.id)
        .or(PaymentMethod.shape.id)
        .transform(value => (Array.isArray(value) ? value : [value]))
        .optional(),
      $excl_paymentMethods: z
        .array(PaymentMethod.shape.id)
        .or(PaymentMethod.shape.id)
        .transform(value => (Array.isArray(value) ? value : [value]))
        .optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const query = req.query;
    const additionalFilters: TAdditionalFilter<(typeof transactions)['_']['config']>[] = [];
    if (query.$dateFrom) {
      const dateFrom = toZonedTime(query.$dateFrom, config.timezone);
      dateFrom.setHours(0, 0, 0, 0);
      additionalFilters.push({columnName: 'processedAt', operator: 'gte', value: dateFrom});
    }
    if (query.$dateTo) {
      const dateTo = toZonedTime(query.$dateTo, config.timezone);
      dateTo.setHours(23, 59, 59, 999);
      additionalFilters.push({columnName: 'processedAt', operator: 'lte', value: dateTo});
    }
    if (query.$categories) {
      additionalFilters.push({columnName: 'categoryId', operator: 'in', value: query.$categories});
    }
    if (query.$excl_categories) {
      additionalFilters.push({columnName: 'categoryId', operator: 'notIn', value: query.$excl_categories});
    }
    if (query.$paymentMethods) {
      additionalFilters.push({columnName: 'paymentMethodId', operator: 'in', value: query.$paymentMethods});
    }
    if (query.$excl_paymentMethods) {
      additionalFilters.push({columnName: 'paymentMethodId', operator: 'notIn', value: query.$excl_paymentMethods});
    }
    const filter = assembleFilter(
      transactions,
      {ownerColumnName: 'ownerId', ownerValue: userId},
      {
        searchTerm: query.search,
        searchableColumnName: ['receiver', 'information'],
      },
      additionalFilters,
    );

    const [[{count: totalCount}], records] = await Promise.all([
      db
        .select({
          count: sql<number>`count(*)`.as('count'),
        })
        .from(transactions)
        .where(filter)
        .limit(1),
      db.query.transactions.findMany({
        where() {
          return filter;
        },
        orderBy(fields, operators) {
          return [operators.desc(fields.processedAt), operators.desc(fields.updatedAt)];
        },
        offset: req.query.from,
        limit: req.query.to ? req.query.to - (req.query.from || 0) : undefined,
        with: {
          category: true,
          paymentMethod: true,
        },
      }),
    ]);

    const transactionIds = records.map(record => record.id);
    const attachmentCountByTransactionId = new Map<string, number>();
    const previewRowsByTransactionId = new Map<
      string,
      {
        id: string;
        ownerId: string;
        fileName: string;
        fileExtension: string;
        contentType: string;
        location: string;
        createdAt: Date;
      }[]
    >();

    if (transactionIds.length > 0) {
      const attachmentRows = await db
        .select({
          transactionId: transactionAttachments.transactionId,
          id: attachments.id,
          ownerId: attachments.ownerId,
          fileName: attachments.fileName,
          fileExtension: attachments.fileExtension,
          contentType: attachments.contentType,
          location: attachments.location,
          createdAt: attachments.createdAt,
        })
        .from(transactionAttachments)
        .innerJoin(attachments, eq(transactionAttachments.attachmentId, attachments.id))
        .where(inArray(transactionAttachments.transactionId, transactionIds))
        .orderBy(desc(attachments.createdAt));

      for (const attachmentRow of attachmentRows) {
        const transactionId = attachmentRow.transactionId;
        if (!transactionId) {
          continue;
        }

        attachmentCountByTransactionId.set(transactionId, (attachmentCountByTransactionId.get(transactionId) ?? 0) + 1);

        const previewRows = previewRowsByTransactionId.get(transactionId) ?? [];
        if (previewRows.length < config.attachments.transactionPreviewLimit) {
          previewRows.push({
            id: attachmentRow.id,
            ownerId: attachmentRow.ownerId,
            fileName: attachmentRow.fileName,
            fileExtension: attachmentRow.fileExtension,
            contentType: attachmentRow.contentType,
            location: attachmentRow.location,
            createdAt: attachmentRow.createdAt,
          });
          previewRowsByTransactionId.set(transactionId, previewRows);
        }
      }
    }

    const previewRows = Array.from(previewRowsByTransactionId.values()).flat();
    const {signedUrls} = await attachmentService.generateSignedUrls(
      previewRows.map(previewRow => ({
        attachmentId: previewRow.id as TAttachment['id'],
        objectStoreLocation: previewRow.location,
      })),
    );

    const previewAttachmentsByTransactionId = new Map<string, TAttachmentWithUrl[]>();
    for (const [transactionId, previewRows] of previewRowsByTransactionId.entries()) {
      previewAttachmentsByTransactionId.set(
        transactionId,
        previewRows.map(previewRow =>
          mapAttachmentWithUrl({
            ...previewRow,
            signedUrl: signedUrls.get(previewRow.id as TAttachment['id']) as TAttachmentWithUrl['signedUrl'],
          }),
        ),
      );
    }

    const enrichedRecords = records.map(record => ({
      ...record,
      // Keep the table payload light: ship only tiny previews plus the total count.
      attachments: previewAttachmentsByTransactionId.get(record.id) ?? [],
      attachmentCount: attachmentCountByTransactionId.get(record.id) ?? 0,
    }));

    ApiResponse.builder<typeof enrichedRecords>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's transactions successfully")
      .withTotalCount(totalCount)
      .withData(enrichedRecords)
      .withFrom('db')
      .buildAndSend(res);
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
      const {attachments: foundAttachments, totalCount} = await attachmentService.findTransactionAttachmentsByOwner(
        userId,
        {from: req.query.from, to: req.query.to, ttl: req.query.ttl},
      );

      ApiResponse.builder<TAttachmentWithUrl[]>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage("Fetched user's transaction attachments successfully")
        .withTotalCount(totalCount)
        .withData(foundAttachments.map(a => mapAttachmentWithUrl(a)))
        .buildAndSend(res);
    } catch (err) {
      attachmentLogger.error("Couldn't fetch transaction attachments: %o", err);
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
    const entityId = req.params.id;
    const record = await db.query.transactions.findFirst({
      where(fields, operators) {
        return operators.and(operators.eq(fields.ownerId, userId), operators.eq(fields.id, entityId));
      },
      with: {
        category: true,
        paymentMethod: true,
      },
    });

    if (!record) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage(`Transaction ${entityId} not found`)
        .withFrom('db')
        .buildAndSend(res);
      return;
    }

    try {
      const {attachments: foundAttachments} = await attachmentService.findAttachmentsByTransactionId(userId, entityId);
      const attachmentsWithUrl = foundAttachments.map(a => mapAttachmentWithUrl(a));

      const enrichedRecord = {
        ...record,
        attachments: attachmentsWithUrl,
        attachmentCount: attachmentsWithUrl.length,
      };

      ApiResponse.builder<typeof enrichedRecord>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage("Fetched user's transaction successfully")
        .withData(enrichedRecord)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      attachmentLogger.error("Couldn't fetch attachments for transaction %s: %o", entityId, err);
      // Respond with transaction data but without attachments on error
      const fallback = {...record, attachmentCount: 0, attachments: []};
      ApiResponse.builder<typeof fallback>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage("Fetched user's transaction successfully")
        .withData(fallback)
        .withFrom('db')
        .buildAndSend(res);
    }
  },
);

transactionRouter.get(
  '/:id/attachments',
  validateRequest({
    params: z.object({
      id: TransactionSchemas.select.shape.id,
    }),
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
      const transactionId = req.params.id;
      const {attachments: foundAttachments, totalCount} = await attachmentService.findAttachmentsByTransactionId(
        userId,
        transactionId,
        {from: req.query.from, to: req.query.to, ttl: req.query.ttl},
      );

      ApiResponse.builder<TAttachmentWithUrl[]>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Fetched transaction attachments successfully')
        .withTotalCount(totalCount)
        .withData(foundAttachments.map(a => mapAttachmentWithUrl(a)))
        .buildAndSend(res);
    } catch (err) {
      attachmentLogger.error("Couldn't fetch attachments for transaction %s: %o", req.params.id, err);
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

transactionRouter.post(
  '/',
  validateRequest({
    body: TransactionSchemas.insert.omit({ownerId: true, processedAt: true}).extend({
      processedAt: z.coerce.date(),
      ownerId: TransactionSchemas.insert.shape.ownerId.optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const requestBody = [req.body].map(body => {
      body.ownerId = userId;
      return body as z.infer<typeof TransactionSchemas.insert>;
    });

    try {
      const createdRecords = await db.insert(transactions).values(requestBody).returning();
      if (createdRecords.length === 0) {
        throw new Error('No transaction created');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Transaction created successfully')
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
      hasAllOwnedIds(userId, categoryIds, async (owner, ids) =>
        db.query.categories.findMany({
          columns: {id: true},
          where(fields, operators) {
            return operators.and(operators.eq(fields.ownerId, owner), operators.inArray(fields.id, ids));
          },
        }),
      ),
      hasAllOwnedIds(userId, paymentMethodIds, async (owner, ids) =>
        db.query.paymentMethods.findMany({
          columns: {id: true},
          where(fields, operators) {
            return operators.and(operators.eq(fields.ownerId, owner), operators.inArray(fields.id, ids));
          },
        }),
      ),
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
      hasAllOwnedIds(userId, ids, async (owner, targetIds) =>
        db.query.transactions.findMany({
          columns: {id: true},
          where(fields, operators) {
            return operators.and(operators.eq(fields.ownerId, owner), operators.inArray(fields.id, targetIds));
          },
        }),
      ),
      hasAllOwnedIds(userId, categoryIds, async (owner, targetIds) =>
        db.query.categories.findMany({
          columns: {id: true},
          where(fields, operators) {
            return operators.and(operators.eq(fields.ownerId, owner), operators.inArray(fields.id, targetIds));
          },
        }),
      ),
      hasAllOwnedIds(userId, paymentMethodIds, async (owner, targetIds) =>
        db.query.paymentMethods.findMany({
          columns: {id: true},
          where(fields, operators) {
            return operators.and(operators.eq(fields.ownerId, owner), operators.inArray(fields.id, targetIds));
          },
        }),
      ),
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
  upload.array('files', config.attachments.upload.maxFilesPerRequest),
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

    try {
      const transactionId = req.params.id as string;
      const uploadedAttachments = await attachmentService.uploadTransactionAttachments(userId, transactionId, files);

      ApiResponse.builder<TAttachmentWithUrl[]>()
        .withStatus(HTTPStatusCode.CREATED)
        .withMessage(`${uploadedAttachments.length} attachment(s) uploaded successfully`)
        .withData(uploadedAttachments.map(a => mapAttachmentWithUrl(a)))
        .buildAndSend(res);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      attachmentLogger.error("Couldn't process attachments for transaction %s: %o", req.params.id, error);
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
    body: TransactionSchemas.update.omit({ownerId: true, processedAt: true}).extend({
      processedAt: z.coerce.date(),
      ownerId: TransactionSchemas.update.shape.ownerId.optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const requestBody = req.body;
    requestBody.ownerId = userId;

    try {
      const updatedRecord = await db
        .update(transactions)
        .set(requestBody)
        .where(and(eq(transactions.ownerId, userId), eq(transactions.id, req.params.id)))
        .returning();
      if (updatedRecord.length === 0) {
        throw new Error('No transaction updated');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Transaction updated successfully')
        .withData(updatedRecord)
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
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
    const entityId = req.params.id;

    try {
      const deletedRecord = await db
        .delete(transactions)
        .where(and(eq(transactions.ownerId, userId), eq(transactions.id, entityId)))
        .returning();
      if (deletedRecord.length === 0) {
        throw new Error('No transaction deleted');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Transaction deleted successfully')
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
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
      const deletedCount = await attachmentService.deleteTransactionAttachments(userId, transactionId, attachmentIds);

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
      attachmentLogger.error("Couldn't delete attachments for transaction %s: %o", req.params.id, err);
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);
