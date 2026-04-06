import type {TUserID} from '@budgetbuddyde/api';
import {SignedAttachmentUrlTTL, type TAttachment, type TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {Category} from '@budgetbuddyde/api/category';
import {PaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {TransactionSchemas, transactionReceiverView, transactions} from '@budgetbuddyde/db/backend';
import {and, eq, sql} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import multer from 'multer';
import z from 'zod';
import {db} from '../db';
import {logger} from '../lib';
import {TransactionAttachmentHandler} from '../lib/attachment';
import {ApiResponse, HTTPStatusCode} from '../models';
import {assembleFilter, type TAdditionalFilter} from './assembleFilter';

export const transactionRouter = Router();
const upload = multer({storage: multer.memoryStorage()});
const attachmentLogger = logger.child({label: 'transactions.attachments'});
const attachmentService = new TransactionAttachmentHandler(process.env.AWS_S3_BUCKET_NAME as string);

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
      const dateFrom = query.$dateFrom;
      dateFrom.setHours(0, 0, 0, 0);
      additionalFilters.push({columnName: 'processedAt', operator: 'gte', value: dateFrom});
    }
    if (query.$dateTo) {
      const dateTo = query.$dateTo;
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
        // extras(fields, operators) {
        //   return {
        //     totalCount: db.$count(transactions,filter).as('total_count'),
        //   }
        // },
        orderBy(fields, operators) {
          return [operators.desc(fields.processedAt), operators.desc(fields.updatedAt)];
        },
        offset: req.query.from,
        limit: req.query.to ? req.query.to - (req.query.from || 0) : undefined,
        with: {
          category: true,
          paymentMethod: true,
          attachments: {
            columns: {attachmentId: true},
          },
        },
      }),
    ]);

    const enrichedRecords = records.map(({attachments, ...rest}) => ({
      ...rest,
      // Only the count is included in list responses to avoid generating signed
      // URLs for every attachment on every transaction (performance-sensitive path).
      // Full attachment data (with signed URLs) is available on GET /:id.
      attachmentCount: attachments.length,
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
        .withData(
          foundAttachments.map(a => ({
            id: a.id,
            ownerId: a.ownerId as TUserID,
            fileName: a.fileName,
            fileExtension: a.fileExtension,
            contentType: a.contentType,
            location: a.location,
            signedUrl: a.signedUrl,
            createdAt: a.createdAt.toISOString(),
          })),
        )
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
      const {attachments: foundAttachments} = await attachmentService.findAttachmentsByTransactionId(
        userId,
        entityId,
      );
      const attachmentsWithUrl = foundAttachments.map(a => ({
        id: a.id,
        // a.ownerId is string in the DB schema but TUserID is a branded type
        // that carries no extra runtime shape, so the cast is safe here.
        ownerId: a.ownerId as TUserID,
        fileName: a.fileName,
        fileExtension: a.fileExtension,
        contentType: a.contentType,
        location: a.location,
        signedUrl: a.signedUrl,
        createdAt: a.createdAt.toISOString(),
      }));

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
        .withData(
          foundAttachments.map(a => ({
            id: a.id,
            ownerId: a.ownerId as TUserID,
            fileName: a.fileName,
            fileExtension: a.fileExtension,
            contentType: a.contentType,
            location: a.location,
            signedUrl: a.signedUrl,
            createdAt: a.createdAt.toISOString(),
          })),
        )
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
  '/:id/attachments',
  upload.array('files'),
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

    try {
      const transactionId = req.params.id;
      const uploadedAttachments = await attachmentService.uploadTransactionAttachments(userId, transactionId, files);

      ApiResponse.builder<TAttachmentWithUrl[]>()
        .withStatus(HTTPStatusCode.CREATED)
        .withMessage(`${uploadedAttachments.length} attachment(s) uploaded successfully`)
        .withData(
          uploadedAttachments.map(a => ({
            id: a.id,
            ownerId: a.ownerId as TAttachment['ownerId'],
            fileName: a.fileName,
            fileExtension: a.fileExtension,
            contentType: a.contentType,
            location: a.location,
            signedUrl: a.signedUrl,
            createdAt: a.createdAt.toISOString(),
          })),
        )
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
