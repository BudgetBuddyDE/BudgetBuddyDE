import type {THistoricalBalance, THistoricalCategoryBalance} from '@budgetbuddyde/api/insights';
import type {TCategory} from '@budgetbuddyde/api/types';
import {categories, transactionHistorySummaryView, transactionHistoryView} from '@budgetbuddyde/db/backend';
import {and, asc, eq, gte, lte} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {z} from 'zod';
import {db} from '../db';
import {ApiResponse, HTTPStatusCode} from '../models';

export const insightsRouter = Router();

const TransactionHistoryQuery = z.object({
  $dateFrom: z.coerce.date().optional(),
  $dateTo: z.coerce.date().optional(),
});

insightsRouter.get(
  '/balance',
  validateRequest({
    query: TransactionHistoryQuery,
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const {$dateFrom, $dateTo} = req.query;
    const conditions = [eq(transactionHistorySummaryView.ownerId, userId)];
    if ($dateFrom !== undefined) {
      conditions.push(gte(transactionHistorySummaryView.date, $dateFrom));
    }
    if ($dateTo !== undefined) {
      conditions.push(lte(transactionHistorySummaryView.date, $dateTo));
    }

    const records = await db
      .select({
        date: transactionHistorySummaryView.date,
        income: transactionHistorySummaryView.income,
        expenses: transactionHistorySummaryView.expenses,
        balance: transactionHistorySummaryView.balance,
      })
      .from(transactionHistorySummaryView)
      .where(and(...conditions))
      .orderBy(asc(transactionHistorySummaryView.date));

    const result: THistoricalBalance[] = records.map(record => ({
      date: record.date instanceof Date ? record.date : new Date(record.date),
      income: record.income,
      expenses: record.expenses,
      balance: record.balance,
    }));

    ApiResponse.builder<typeof result>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's balance history successfully")
      .withData(result)
      .withFrom('db')
      .buildAndSend(res);
  },
);

insightsRouter.get(
  '/category-balance',
  validateRequest({
    query: TransactionHistoryQuery,
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const {$dateFrom, $dateTo} = req.query;
    const conditions = [eq(transactionHistoryView.ownerId, userId)];
    if ($dateFrom !== undefined) {
      conditions.push(gte(transactionHistoryView.date, $dateFrom));
    }
    if ($dateTo !== undefined) {
      conditions.push(lte(transactionHistoryView.date, $dateTo));
    }

    const records = await db
      .select({
        date: transactionHistoryView.date,
        income: transactionHistoryView.income,
        expenses: transactionHistoryView.expenses,
        balance: transactionHistoryView.balance,
        categoryId: transactionHistoryView.categoryId,
        categoryName: categories.name,
        categoryDescription: categories.description,
      })
      .from(transactionHistoryView)
      .leftJoin(categories, eq(transactionHistoryView.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(asc(transactionHistoryView.date));

    const result: THistoricalCategoryBalance[] = records.map(record => ({
      date: record.date instanceof Date ? record.date : new Date(record.date),
      income: record.income,
      expenses: record.expenses,
      balance: record.balance,
      category: {
        id: record.categoryId,
        name: record.categoryName,
        description: record.categoryDescription,
      } as Pick<TCategory, 'id' | 'name' | 'description'>,
    }));

    ApiResponse.builder<typeof result>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's category balance history successfully")
      .withData(result)
      .withFrom('db')
      .buildAndSend(res);
  },
);
