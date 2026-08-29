import {GetObjectCommand} from '@aws-sdk/client-s3';
import {
  attachments,
  budgets,
  categories,
  paymentMethods,
  recurringPayments,
  transactionAttachments,
  transactions,
} from '@budgetbuddyde/db/backend';
import {asc, eq} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {getRequiredObjectStorageConfig} from '../config';
import {db} from '../db';
import {logger} from '../lib/logger';
import {getS3Client} from '../lib/s3';
import {ApiResponse, HTTPStatusCode} from '../models';
import {
  attachmentExportPath,
  applicationExportQuerySchema,
  createZipArchive,
  objectBodyToBuffer,
  serializeCsv,
  type TApplicationExportResource,
  type TApplicationExportRow,
} from './applicationExport';

export const applicationRouter = Router();

const exportColumns: Record<TApplicationExportResource, readonly string[]> = {
  categories: ['id', 'ownerId', 'name', 'description', 'createdAt', 'updatedAt'],
  'payment-methods': ['id', 'ownerId', 'name', 'provider', 'address', 'description', 'createdAt', 'updatedAt'],
  transactions: [
    'id',
    'ownerId',
    'categoryId',
    'paymentMethodId',
    'processedAt',
    'receiver',
    'transferAmount',
    'information',
    'createdAt',
    'updatedAt',
  ],
  'recurring-payments': [
    'id',
    'ownerId',
    'categoryId',
    'paymentMethodId',
    'executionPlan',
    'startsOn',
    'paused',
    'receiver',
    'transferAmount',
    'information',
    'createdAt',
    'updatedAt',
  ],
  budgets: ['id', 'ownerId', 'type', 'name', 'budget', 'description', 'categoryIds', 'createdAt', 'updatedAt'],
  attachments: [
    'id',
    'ownerId',
    'transactionIds',
    'fileName',
    'fileExtension',
    'contentType',
    'createdAt',
    'contentPath',
  ],
};

function exportFileContent(format: 'csv' | 'json', rows: TApplicationExportRow[], columns: readonly string[]): Buffer {
  const content = format === 'csv' ? serializeCsv(rows, columns) : `${JSON.stringify(rows, null, 2)}\n`;
  return Buffer.from(content, 'utf8');
}

applicationRouter.get('/export', validateRequest({query: applicationExportQuerySchema}), async (req, res) => {
  const userId = req.context.user?.id;
  if (!userId) {
    ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
    return;
  }

  const {format, resources} = req.query;
  const selectedResources = new Set(resources);
  const [categoryRows, paymentMethodRows, transactionRows, recurringPaymentRows, budgetRows, attachmentRows] =
    await Promise.all([
      selectedResources.has('categories')
        ? db.query.categories.findMany({where: eq(categories.ownerId, userId), orderBy: asc(categories.id)})
        : Promise.resolve([]),
      selectedResources.has('payment-methods')
        ? db.query.paymentMethods.findMany({where: eq(paymentMethods.ownerId, userId), orderBy: asc(paymentMethods.id)})
        : Promise.resolve([]),
      selectedResources.has('transactions')
        ? db.query.transactions.findMany({where: eq(transactions.ownerId, userId), orderBy: asc(transactions.id)})
        : Promise.resolve([]),
      selectedResources.has('recurring-payments')
        ? db.query.recurringPayments.findMany({
            where: eq(recurringPayments.ownerId, userId),
            orderBy: asc(recurringPayments.id),
          })
        : Promise.resolve([]),
      selectedResources.has('budgets')
        ? db.query.budgets.findMany({
            where: eq(budgets.ownerId, userId),
            orderBy: asc(budgets.id),
            with: {categories: {columns: {categoryId: true}}},
          })
        : Promise.resolve([]),
      selectedResources.has('attachments')
        ? db
            .select({
              id: attachments.id,
              ownerId: attachments.ownerId,
              fileName: attachments.fileName,
              fileExtension: attachments.fileExtension,
              contentType: attachments.contentType,
              location: attachments.location,
              createdAt: attachments.createdAt,
              transactionId: transactionAttachments.transactionId,
            })
            .from(attachments)
            .leftJoin(transactionAttachments, eq(transactionAttachments.attachmentId, attachments.id))
            .where(eq(attachments.ownerId, userId))
            .orderBy(asc(attachments.id), asc(transactionAttachments.transactionId))
        : Promise.resolve([]),
    ]);

  const attachmentExports = new Map<
    string,
    {
      id: string;
      ownerId: string;
      fileName: string;
      fileExtension: string;
      contentType: string;
      location: string;
      createdAt: Date;
      transactionIds: string[];
      contentPath: string;
    }
  >();
  for (const attachment of attachmentRows) {
    const existing = attachmentExports.get(attachment.id);
    if (existing) {
      if (attachment.transactionId) existing.transactionIds.push(attachment.transactionId);
      continue;
    }

    attachmentExports.set(attachment.id, {
      id: attachment.id,
      ownerId: attachment.ownerId,
      fileName: attachment.fileName,
      fileExtension: attachment.fileExtension,
      contentType: attachment.contentType,
      location: attachment.location,
      createdAt: attachment.createdAt,
      transactionIds: attachment.transactionId ? [attachment.transactionId] : [],
      contentPath: attachmentExportPath(attachment.id, attachment.fileName),
    });
  }
  const attachmentExportRows = [...attachmentExports.values()];

  const rowsByResource: Partial<Record<TApplicationExportResource, TApplicationExportRow[]>> = {
    categories: categoryRows,
    'payment-methods': paymentMethodRows,
    transactions: transactionRows,
    'recurring-payments': recurringPaymentRows,
    budgets: budgetRows.map(({categories: associations, ...budget}) => ({
      ...budget,
      categoryIds: associations.map(association => association.categoryId),
    })),
    attachments: attachmentExportRows.map(({location: _location, ...attachment}) => attachment),
  };

  const exportedAt = new Date().toISOString();
  const files = resources.map(resource => {
    const rows = rowsByResource[resource] ?? [];
    return {
      name: `${resource}.${format}`,
      content: exportFileContent(format, rows, exportColumns[resource]),
    };
  });
  if (selectedResources.has('attachments')) {
    try {
      const {bucketName} = getRequiredObjectStorageConfig();
      const attachmentFiles = [];
      for (const attachment of attachmentExportRows) {
        const object = await getS3Client().send(new GetObjectCommand({Bucket: bucketName, Key: attachment.location}));
        attachmentFiles.push({
          name: attachment.contentPath,
          content: await objectBodyToBuffer(object.Body, object.ContentEncoding),
        });
      }
      files.push(...attachmentFiles);
    } catch {
      logger.error('Unable to read attachment objects for application export', {userId});
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
        .withMessage('Unable to export attachments')
        .buildAndSend(res);
      return;
    }
  }
  files.push({
    name: 'manifest.json',
    content: Buffer.from(
      `${JSON.stringify(
        {
          schemaVersion: 1,
          archiveFormat: 'zip',
          format,
          exportedAt,
          resources: resources.map(resource => ({
            file: `${resource}.${format}`,
            resource,
            rowCount: rowsByResource[resource]?.length ?? 0,
          })),
          attachmentsIncluded: selectedResources.has('attachments'),
        },
        null,
        2,
      )}\n`,
      'utf8',
    ),
  });

  const archive = createZipArchive(files, new Date(exportedAt));
  res.status(HTTPStatusCode.OK);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="budgetbuddy-application-export-${exportedAt.slice(0, 10)}.zip"`,
  );
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(archive);
});
