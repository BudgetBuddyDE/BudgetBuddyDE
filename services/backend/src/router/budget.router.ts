import {listOccurrenceDates} from '@budgetbuddyde/api/recurringPayment';
import {
  BudgetWithCategoriesSchema,
  budgetCategories,
  budgets,
  recurringPayments,
  transactionHistoryView,
  transactions,
} from '@budgetbuddyde/db/backend';
import {endOfMonth, format, startOfMonth} from 'date-fns';
import {fromZonedTime, toZonedTime} from 'date-fns-tz';
import {and, eq, gte, inArray, lte, sql} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import z from 'zod';
import {config} from '../config';
import {db} from '../db';
import {ApiResponse, HTTPStatusCode, NotFoundError} from '../models';
import {assembleFilter} from './assembleFilter';
import {hasAllOwnedIds, ownedIdsFinder} from './batch';
import {paginationFields, paginationWindow} from './pagination';

export const budgetRouter = Router();

// REVISIT: Cache the estimated budget result where possible.
budgetRouter.get('/estimated', async (req, res) => {
  const userId = req.context.user?.id;
  if (!userId) {
    ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
    return;
  }

  const now = new Date();
  const zonedToday = toZonedTime(now, config.timezone);
  const today = format(zonedToday, 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(zonedToday), 'yyyy-MM-dd');
  const firstOfMonthInstant = fromZonedTime(startOfMonth(zonedToday), config.timezone);
  const endOfMonthInstant = fromZonedTime(endOfMonth(zonedToday), config.timezone);
  const [transactionTotals, activeRecurringPayments] = await Promise.all([
    db
      .select({
        paidExpenses:
          sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transferAmount} <= 0 AND ${transactions.processedAt} <= ${now} THEN ABS(${transactions.transferAmount}) ELSE 0 END), 0)`.as(
            'paid_expenses',
          ),
        upcomingExpenses:
          sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transferAmount} <= 0 AND ${transactions.processedAt} > ${now} THEN ABS(${transactions.transferAmount}) ELSE 0 END), 0)`.as(
            'upcoming_expenses',
          ),
        receivedIncome:
          sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transferAmount} >= 0 AND ${transactions.processedAt} <= ${now} THEN ${transactions.transferAmount} ELSE 0 END), 0)`.as(
            'received_income',
          ),
        upcomingIncome:
          sql<number>`COALESCE(SUM(CASE WHEN ${transactions.transferAmount} >= 0 AND ${transactions.processedAt} > ${now} THEN ${transactions.transferAmount} ELSE 0 END), 0)`.as(
            'upcoming_income',
          ),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.ownerId, userId),
          gte(transactions.processedAt, firstOfMonthInstant),
          lte(transactions.processedAt, endOfMonthInstant),
        ),
      ),
    db.query.recurringPayments.findMany({
      where: and(
        eq(recurringPayments.ownerId, userId),
        eq(recurringPayments.paused, false),
        lte(recurringPayments.startsOn, monthEnd),
      ),
    }),
  ]);

  let upcomingRecurringExpenses = 0;
  let upcomingRecurringIncome = 0;
  for (const payment of activeRecurringPayments) {
    const occurrenceCount = listOccurrenceDates(payment, today, monthEnd).filter(date => date > today).length;
    if (payment.transferAmount < 0) upcomingRecurringExpenses += Math.abs(payment.transferAmount) * occurrenceCount;
    else upcomingRecurringIncome += payment.transferAmount * occurrenceCount;
  }

  const paidExpenses = transactionTotals[0].paidExpenses;
  const upcomingExpenses = transactionTotals[0].upcomingExpenses + upcomingRecurringExpenses;
  const receivedIncome = transactionTotals[0].receivedIncome;
  const upcomingIncome = transactionTotals[0].upcomingIncome + upcomingRecurringIncome;
  const freeAmount = receivedIncome + upcomingIncome - (paidExpenses + upcomingExpenses);
  ApiResponse.builder()
    .withData({
      expenses: {
        paid: paidExpenses,
        upcoming: upcomingExpenses,
      },
      income: {
        received: receivedIncome,
        upcoming: upcomingIncome,
      },
      freeAmount: freeAmount,
    })
    .buildAndSend(res);
});

// REVISIT: Cache budget responses where possible.
budgetRouter.get(
  '/',
  validateRequest({
    query: z.object({
      search: z.string().optional(),
      ...paginationFields,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const filter = assembleFilter(
      budgets,
      {ownerColumnName: 'ownerId', ownerValue: userId},
      {
        searchTerm: req.query.search,
        searchableColumnName: ['name', 'description'],
      },
    );

    const [[{count: totalCount}], records] = await Promise.all([
      db
        .select({
          count: sql<number>`count(${budgets.id})`.as('count'),
        })
        .from(budgets)
        .where(filter)
        .limit(1),
      db.query.budgets.findMany({
        where() {
          return filter;
        },
        orderBy(fields, operators) {
          return [operators.desc(fields.updatedAt)];
        },
        ...paginationWindow(req.query),
        with: {
          categories: {
            with: {
              category: true,
            },
          },
        },
      }),
    ]);

    const balances = await calculateBudgetBalances(userId, records);
    const updatedBudgets = records.map((budget, index) => ({
      ...budget,
      balance: balances[index],
    }));

    ApiResponse.builder<typeof updatedBudgets>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's budgets successfully")
      .withData(updatedBudgets)
      .withTotalCount(totalCount)
      .withFrom('db')
      .buildAndSend(res);
  },
);

budgetRouter.get(
  '/:id',
  validateRequest({
    params: z.object({
      id: BudgetWithCategoriesSchema.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const entityId = req.params.id;
    const record = await db.query.budgets.findFirst({
      where(fields, operators) {
        return operators.and(eq(fields.ownerId, userId), operators.eq(fields.id, entityId));
      },
      with: {
        categories: {
          with: {
            category: true,
          },
        },
      },
    });

    if (!record) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage(`Budget ${entityId} not found`)
        .withFrom('db')
        .buildAndSend(res);
      return;
    }

    const [balance] = await calculateBudgetBalances(userId, [record]);
    const budgetWithBalance: typeof record & {balance: number} = {
      ...record,
      balance,
    };

    ApiResponse.builder<typeof budgetWithBalance>()
      .withStatus(HTTPStatusCode.OK)
      .withData(budgetWithBalance)
      .withMessage("Fetched user's budget successfully")
      .withFrom('db')
      .buildAndSend(res);
  },
);

budgetRouter.post(
  '/',
  validateRequest({
    body: BudgetWithCategoriesSchema.insert.omit({ownerId: true}).extend({
      ownerId: BudgetWithCategoriesSchema.insert.shape.ownerId.optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const {categories: categoryIds, ...budgetData} = req.body;
    const newBudget = {...budgetData, ownerId: userId};

    if (!(await hasAllOwnedIds(userId, categoryIds, ownedIdsFinder(db.query.categories)))) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('One or more referenced categories are invalid')
        .buildAndSend(res);
      return;
    }

    try {
      const result = await db.transaction(async tx => {
        const [createdBudget] = await tx.insert(budgets).values(newBudget).returning();

        if (categoryIds && categoryIds.length > 0) {
          const budgetCategoryLinks = categoryIds.map(catId => ({
            budgetId: createdBudget.id,
            categoryId: catId,
          }));
          await tx.insert(budgetCategories).values(budgetCategoryLinks);
        }

        return await tx.query.budgets.findFirst({
          where: eq(budgets.id, createdBudget.id),
          with: {
            categories: {
              with: {
                category: true,
              },
            },
          },
        });
      });

      if (!result) {
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
          .withMessage('Failed to retrieve updated budget')
          .withFrom('db')
          .buildAndSend(res);
      }
      const [budgetBalance] = await calculateBudgetBalances(userId, [result]);
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Budget created successfully')
        .withData({
          ...result,
          balance: budgetBalance,
        })
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

budgetRouter.put(
  '/:id',
  validateRequest({
    params: z.object({
      id: BudgetWithCategoriesSchema.select.shape.id,
    }),
    body: BudgetWithCategoriesSchema.update.omit({ownerId: true}).extend({
      ownerId: BudgetWithCategoriesSchema.update.shape.ownerId.optional(),
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const budgetId = req.params.id;
    const {categories: newCategoryIds, ...budgetData} = req.body;

    if (
      newCategoryIds !== undefined &&
      !(await hasAllOwnedIds(userId, newCategoryIds, ownedIdsFinder(db.query.categories)))
    ) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('One or more referenced categories are invalid')
        .buildAndSend(res);
      return;
    }

    try {
      const result = await db.transaction(async tx => {
        const [updatedBudget] = await tx
          .update(budgets)
          .set(budgetData)
          .where(and(eq(budgets.id, budgetId), eq(budgets.ownerId, userId)))
          .returning();

        if (!updatedBudget) {
          throw new NotFoundError('Budget not found');
        }

        if (newCategoryIds !== undefined) {
          const existingLinks = await tx.select().from(budgetCategories).where(eq(budgetCategories.budgetId, budgetId));

          const existingCategoryIds = existingLinks.map(l => l.categoryId);

          const toAdd = newCategoryIds.filter(id => !existingCategoryIds.includes(id));
          const toRemove = existingCategoryIds.filter(id => !newCategoryIds.includes(id));

          if (toRemove.length > 0) {
            await tx
              .delete(budgetCategories)
              .where(and(eq(budgetCategories.budgetId, budgetId), inArray(budgetCategories.categoryId, toRemove)));
          }

          if (toAdd.length > 0) {
            await tx.insert(budgetCategories).values(
              toAdd.map(catId => ({
                budgetId: budgetId,
                categoryId: catId,
              })),
            );
          }
        }

        return await tx.query.budgets.findFirst({
          where: eq(budgets.id, budgetId),
          with: {
            categories: {
              with: {
                category: true,
              },
            },
          },
        });
      });

      if (!result) {
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
          .withMessage('Failed to retrieve updated budget')
          .withFrom('db')
          .buildAndSend(res);
      }
      const [budgetBalance] = await calculateBudgetBalances(userId, [result]);
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Budget updated successfully')
        .withData({
          ...result,
          balance: budgetBalance,
        })
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

budgetRouter.delete(
  '/:id',
  validateRequest({
    params: z.object({
      id: BudgetWithCategoriesSchema.select.shape.id,
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
        .delete(budgets)
        .where(and(eq(budgets.ownerId, userId), eq(budgets.id, entityId)))
        .returning();

      if (deletedRecord.length === 0) {
        throw new NotFoundError('Budget not found');
      }

      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Budget deleted successfully')
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);

type TBudgetBalanceTarget = {
  type: 'i' | 'e';
  categories: readonly {categoryId: string}[];
};

/**
 * Computes monthly balances for multiple budgets with a single grouped query.
 *
 * Type `i` sums expenses of the assigned categories; type `e` sums all other
 * categories. Budgets without categories keep their previous zero balance.
 */
async function calculateBudgetBalances(
  ownerId: string,
  budgets: readonly TBudgetBalanceTarget[],
  time: Date = new Date(),
): Promise<number[]> {
  if (budgets.length === 0) return [];

  const currentMonth = time.getMonth() + 1;
  const currentYear = time.getFullYear();

  const rows = await db
    .select({
      categoryId: transactionHistoryView.categoryId,
      expenses: sql<number>`COALESCE(SUM(${transactionHistoryView.expenses}), 0)`.as('expenses'),
    })
    .from(transactionHistoryView)
    .where(
      and(
        eq(transactionHistoryView.ownerId, ownerId),
        eq(transactionHistoryView.month, currentMonth),
        eq(transactionHistoryView.year, currentYear),
      ),
    )
    .groupBy(transactionHistoryView.categoryId);

  const expensesByCategory = new Map<string, number>();
  let totalExpenses = 0;
  for (const row of rows) {
    if (row.categoryId === null) continue;
    expensesByCategory.set(row.categoryId, row.expenses);
    totalExpenses += row.expenses;
  }

  return budgets.map(budget => {
    const categories = budget.categories.map(category => category.categoryId);
    if (categories.length === 0) return 0;
    const assignedExpenses = categories.reduce((sum, categoryId) => sum + (expensesByCategory.get(categoryId) ?? 0), 0);
    return budget.type === 'i' ? assignedExpenses : totalExpenses - assignedExpenses;
  });
}
