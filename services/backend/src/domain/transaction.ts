import type {TUserID} from '@budgetbuddyde/api';
import {SignedAttachmentUrlTTL, type TAttachment, type TAttachmentWithUrl} from '@budgetbuddyde/api/attachment';
import {Category} from '@budgetbuddyde/api/category';
import {PaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {attachments, TransactionSchemas, transactionAttachments, transactions} from '@budgetbuddyde/db/backend';
import {toZonedTime} from 'date-fns-tz';
import {and, eq, inArray, sql} from 'drizzle-orm';
import z from 'zod';
import {invalidateDomainMutation} from './cache';
import {config} from '../config';
import {db} from '../db';
import {logger} from '../lib';
import {TransactionAttachmentHandler} from '../lib/attachment';
import {ApiResponse, HTTPStatusCode, NotFoundError} from '../models';
import {assembleFilter, type TAdditionalFilter} from '../router/assembleFilter';
import {hasAllOwnedIds, ownedIdsFinder} from '../router/batch';
import {paginationFields, paginationWindow, refinePagination} from '../router/pagination';
const attachmentLogger = logger.child({module: 'transactions.attachments'});
let attachmentService: TransactionAttachmentHandler | undefined;

function getAttachmentService(): TransactionAttachmentHandler {
  attachmentService ??= new TransactionAttachmentHandler(config.getRequiredObjectStorageConfig().bucketName);
  return attachmentService;
}

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

export const transactionListSchema = z
  .object({
    search: z.string().optional(),
    ...paginationFields,
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
    $receiver: z.string().optional(),
    $transactionType: z.enum(['income', 'expense']).optional(),
  })
  .superRefine(refinePagination);

export const transactionCreateSchema = TransactionSchemas.insert.omit({ownerId: true, processedAt: true}).extend({
  processedAt: z.coerce.date(),
  ownerId: TransactionSchemas.insert.shape.ownerId.optional(),
});
export const transactionUpdateSchema = TransactionSchemas.update.omit({ownerId: true, processedAt: true}).extend({
  processedAt: z.coerce.date(),
  ownerId: TransactionSchemas.update.shape.ownerId.optional(),
});
export const transactionAttachmentsQuerySchema = z
  .object({...paginationFields, ttl: SignedAttachmentUrlTTL.optional()})
  .superRefine(refinePagination);

export async function listTransactions(userId: string, input: z.input<typeof transactionListSchema> = {}) {
  const parsedInput = transactionListSchema.parse(input);

  const query = parsedInput;
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
  if (query.$receiver) {
    additionalFilters.push({columnName: 'receiver', operator: 'eq', value: query.$receiver});
  }
  if (query.$transactionType === 'income') {
    additionalFilters.push({columnName: 'transferAmount', operator: 'gte', value: 0});
  }
  if (query.$transactionType === 'expense') {
    additionalFilters.push({columnName: 'transferAmount', operator: 'lte', value: -Number.EPSILON});
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
      ...paginationWindow(parsedInput),
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
    const rankedAttachments = db
      .select({
        transactionId: transactionAttachments.transactionId,
        id: attachments.id,
        ownerId: attachments.ownerId,
        fileName: attachments.fileName,
        fileExtension: attachments.fileExtension,
        contentType: attachments.contentType,
        location: attachments.location,
        createdAt: attachments.createdAt,
        rank: sql<number>`row_number() over (partition by ${transactionAttachments.transactionId} order by ${attachments.createdAt} desc, ${attachments.id} desc)`.as(
          'rank',
        ),
      })
      .from(transactionAttachments)
      .innerJoin(attachments, eq(transactionAttachments.attachmentId, attachments.id))
      .where(and(eq(attachments.ownerId, userId), inArray(transactionAttachments.transactionId, transactionIds)))
      .as('ranked_attachments');

    const [attachmentCounts, attachmentRows] = await Promise.all([
      db
        .select({
          transactionId: transactionAttachments.transactionId,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(transactionAttachments)
        .innerJoin(attachments, eq(transactionAttachments.attachmentId, attachments.id))
        .where(and(eq(attachments.ownerId, userId), inArray(transactionAttachments.transactionId, transactionIds)))
        .groupBy(transactionAttachments.transactionId),
      db
        .select({
          transactionId: rankedAttachments.transactionId,
          id: rankedAttachments.id,
          ownerId: rankedAttachments.ownerId,
          fileName: rankedAttachments.fileName,
          fileExtension: rankedAttachments.fileExtension,
          contentType: rankedAttachments.contentType,
          location: rankedAttachments.location,
          createdAt: rankedAttachments.createdAt,
        })
        .from(rankedAttachments)
        .where(sql`${rankedAttachments.rank} <= ${config.attachments.transactionPreviewLimit}`),
    ]);

    for (const {transactionId, count} of attachmentCounts) {
      if (transactionId) attachmentCountByTransactionId.set(transactionId, Number(count));
    }

    for (const attachmentRow of attachmentRows) {
      const transactionId = attachmentRow.transactionId;
      if (!transactionId) {
        continue;
      }

      const previewRows = previewRowsByTransactionId.get(transactionId) ?? [];
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

  const previewRows = Array.from(previewRowsByTransactionId.values()).flat();
  const {signedUrls} = await getAttachmentService().generateSignedUrls(
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

  return ApiResponse.builder<typeof enrichedRecords>()
    .withStatus(HTTPStatusCode.OK)
    .withMessage("Fetched user's transactions successfully")
    .withTotalCount(totalCount)
    .withData(enrichedRecords)
    .withFrom('db')
    .build();
}

export async function getTransaction(userId: string, entityIdInput: string) {
  TransactionSchemas.select.shape.id.parse(entityIdInput);
  const entityId = entityIdInput;
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
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.NOT_FOUND)
      .withMessage(`Transaction ${entityId} not found`)
      .withFrom('db')
      .build();
  }

  try {
    const {attachments: foundAttachments} = await getAttachmentService().findAttachmentsByTransactionId(
      userId,
      entityId,
    );
    const attachmentsWithUrl = foundAttachments.map(a => mapAttachmentWithUrl(a));

    const enrichedRecord = {
      ...record,
      attachments: attachmentsWithUrl,
      attachmentCount: attachmentsWithUrl.length,
    };

    return ApiResponse.builder<typeof enrichedRecord>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's transaction successfully")
      .withData(enrichedRecord)
      .withFrom('db')
      .build();
  } catch (err) {
    attachmentLogger.error(
      "Couldn't fetch attachments for transaction %s",
      entityId,
      err instanceof Error ? err : new Error(String(err)),
    );
    // Respond with transaction data but without attachments on error
    const fallback = {...record, attachmentCount: 0, attachments: []};
    return ApiResponse.builder<typeof fallback>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's transaction successfully")
      .withData(fallback)
      .withFrom('db')
      .build();
  }
}

export async function listTransactionAttachments(
  userId: string,
  entityIdInput: string,
  input: z.input<typeof transactionAttachmentsQuerySchema> = {},
) {
  TransactionSchemas.select.shape.id.parse(entityIdInput);
  const parsedInput = transactionAttachmentsQuerySchema.parse(input);

  try {
    const transactionId = entityIdInput;
    const {attachments: foundAttachments, totalCount} = await getAttachmentService().findAttachmentsByTransactionId(
      userId,
      transactionId,
      {from: parsedInput.from, to: parsedInput.to, ttl: parsedInput.ttl},
    );

    return ApiResponse.builder<TAttachmentWithUrl[]>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Fetched transaction attachments successfully')
      .withTotalCount(totalCount)
      .withData(foundAttachments.map(a => mapAttachmentWithUrl(a)))
      .build();
  } catch (err) {
    attachmentLogger.error(
      "Couldn't fetch attachments for transaction %s",
      entityIdInput,
      err instanceof Error ? err : new Error(String(err)),
    );
    return ApiResponse.builder()
      .fromError(err instanceof Error ? err : new Error(String(err)))
      .build();
  }
}

export async function createTransaction(userId: string, input: z.input<typeof transactionCreateSchema>) {
  const parsedInput = transactionCreateSchema.parse(input);

  const [categoryOwned, paymentMethodOwned] = await Promise.all([
    hasAllOwnedIds(userId, [parsedInput.categoryId], ownedIdsFinder(db.query.categories)),
    hasAllOwnedIds(userId, [parsedInput.paymentMethodId], ownedIdsFinder(db.query.paymentMethods)),
  ]);
  if (!categoryOwned || !paymentMethodOwned) {
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.BAD_REQUEST)
      .withMessage('Referenced category or payment method is invalid')
      .build();
  }

  const requestBody = [parsedInput].map(body => {
    body.ownerId = userId;
    return body as z.infer<typeof TransactionSchemas.insert>;
  });

  try {
    const createdRecords = await db.insert(transactions).values(requestBody).returning();
    if (createdRecords.length === 0) {
      throw new Error('No transaction created');
    }
    await invalidateDomainMutation(userId, '/api/transaction');
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Transaction created successfully')
      .withData(createdRecords)
      .withFrom('db')
      .build();
  } catch (err) {
    return ApiResponse.builder()
      .fromError(err instanceof Error ? err : new Error(String(err)))
      .build();
  }
}

export async function updateTransaction(
  userId: string,
  entityIdInput: string,
  input: Partial<z.input<typeof transactionUpdateSchema>>,
) {
  TransactionSchemas.select.shape.id.parse(entityIdInput);
  const parsedInput = transactionUpdateSchema.parse(input);

  const [categoryOwned, paymentMethodOwned] = await Promise.all([
    hasAllOwnedIds(userId, parsedInput.categoryId ? [parsedInput.categoryId] : [], ownedIdsFinder(db.query.categories)),
    hasAllOwnedIds(
      userId,
      parsedInput.paymentMethodId ? [parsedInput.paymentMethodId] : [],
      ownedIdsFinder(db.query.paymentMethods),
    ),
  ]);
  if (!categoryOwned || !paymentMethodOwned) {
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.BAD_REQUEST)
      .withMessage('Referenced category or payment method is invalid')
      .build();
  }

  const requestBody = parsedInput;
  requestBody.ownerId = userId;

  try {
    const updatedRecord = await db
      .update(transactions)
      .set(requestBody)
      .where(and(eq(transactions.ownerId, userId), eq(transactions.id, entityIdInput)))
      .returning();
    if (updatedRecord.length === 0) {
      throw new NotFoundError('Transaction not found');
    }
    await invalidateDomainMutation(userId, '/api/transaction');
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Transaction updated successfully')
      .withData(updatedRecord)
      .withFrom('db')
      .build();
  } catch (err) {
    return ApiResponse.builder()
      .fromError(err instanceof Error ? err : new Error(String(err)))
      .build();
  }
}

export async function removeTransaction(userId: string, entityIdInput: string) {
  TransactionSchemas.select.shape.id.parse(entityIdInput);
  const entityId = entityIdInput;

  try {
    const deletedRecord = await db
      .delete(transactions)
      .where(and(eq(transactions.ownerId, userId), eq(transactions.id, entityId)))
      .returning();
    if (deletedRecord.length === 0) {
      throw new NotFoundError('Transaction not found');
    }
    await invalidateDomainMutation(userId, '/api/transaction');
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Transaction deleted successfully')
      .withFrom('db')
      .build();
  } catch (err) {
    return ApiResponse.builder()
      .fromError(err instanceof Error ? err : new Error(String(err)))
      .build();
  }
}
