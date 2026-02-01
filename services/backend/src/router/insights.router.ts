import {and, desc, eq, gte, lte} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {z} from 'zod';
import {db} from '../db';
import {categories, transactionHistorySummaryView, transactionHistoryView} from '../db/schema';
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
      conditions.push(gte(transactionHistoryView.date, $dateFrom));
    }
    if ($dateTo !== undefined) {
      conditions.push(lte(transactionHistoryView.date, $dateTo));
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
      .orderBy(desc(transactionHistorySummaryView.year), desc(transactionHistorySummaryView.month));

    ApiResponse.builder<typeof records>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's balance history successfully")
      .withData(records)
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
    const conditions = [eq(transactionHistorySummaryView.ownerId, userId)];
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
      .orderBy(desc(transactionHistoryView.year), desc(transactionHistoryView.month));

    ApiResponse.builder()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's category balance history successfully")
      .withData(
        records.map(({income, expenses, balance, categoryId, categoryName, categoryDescription}) => ({
          income,
          expenses,
          balance,
          category: {
            id: categoryId,
            name: categoryName,
            description: categoryDescription,
          },
        })),
      )
      .withFrom('db')
      .buildAndSend(res);
  },
);
