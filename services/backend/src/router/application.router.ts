import {budgets, categories, paymentMethods, recurringPayments, transactions} from '@budgetbuddyde/db/backend';
import {asc, eq} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {db} from '../db';
import {ApiResponse, HTTPStatusCode} from '../models';
import {
  applicationExportQuerySchema,
  createZipArchive,
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
  const [categoryRows, paymentMethodRows, transactionRows, recurringPaymentRows, budgetRows] = await Promise.all([
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
  ]);

  const rowsByResource: Partial<Record<TApplicationExportResource, TApplicationExportRow[]>> = {
    categories: categoryRows,
    'payment-methods': paymentMethodRows,
    transactions: transactionRows,
    'recurring-payments': recurringPaymentRows,
    budgets: budgetRows.map(({categories: associations, ...budget}) => ({
      ...budget,
      categoryIds: associations.map(association => association.categoryId),
    })),
  };

  const exportedAt = new Date().toISOString();
  const files = resources.map(resource => {
    const rows = rowsByResource[resource] ?? [];
    return {
      name: `${resource}.${format}`,
      content: exportFileContent(format, rows, exportColumns[resource]),
    };
  });
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
          attachmentsIncluded: false,
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
