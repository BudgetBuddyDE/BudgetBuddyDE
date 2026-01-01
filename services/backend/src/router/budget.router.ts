import {and, eq, gt, gte, inArray, lte, notInArray, sql} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import z from 'zod';
import {db} from '../db';
import {budgetCategories, budgets, recurringPayments, transactions} from '../db/schema/tables';
import {BudgetWithCategoriesSchema} from '../db/schema/types';
import {ApiResponse, HTTPStatusCode} from '../models';
import {assembleFilter} from './assembleFilter';

export const budgetRouter = Router();

// REVISIT: Optimize the queries below for performance and cache the results where possibleg
budgetRouter.get('/estimated', async (req, res) => {
  const userId = req.context.user?.id;
  if (!userId) {
    ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
    return;
  }

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [
    paidExpensesResult,
    upcomingTransactionsExpensesResult,
    upcomingRecurringExpensesResult,
    receivedIncomeResult,
    upcomingTransactionIncomeResult,
    upcomingRecurringIncomeResult,
  ] = await Promise.all([
    db
      .select({
        expenses: sql<number>`COALESCE(SUM(ABS(${transactions.transferAmount})), 0)`.as('expenses'),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.ownerId, userId),
          lte(transactions.transferAmount, 0),
          gte(transactions.processedAt, firstOfMonth),
          lte(transactions.processedAt, today),
        ),
      ),
    db
      .select({
        expenses: sql<number>`COALESCE(SUM(ABS(${transactions.transferAmount})), 0)`.as('expenses'),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.ownerId, userId),
          lte(transactions.transferAmount, 0),
          gt(transactions.processedAt, today),
          lte(transactions.processedAt, endOfMonth),
        ),
      ),
    db
      .select({
        expenses: sql<number>`COALESCE(SUM(ABS(${recurringPayments.transferAmount})), 0)`.as('expenses'),
      })
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.ownerId, userId),
          lte(recurringPayments.transferAmount, 0),
          gt(recurringPayments.executeAt, today.getDate()),
          lte(recurringPayments.executeAt, 31),
        ),
      ),
    db
      .select({
        income: sql<number>`COALESCE(SUM(${transactions.transferAmount}), 0)`.as('income'),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.ownerId, userId),
          gte(transactions.transferAmount, 0),
          gte(transactions.processedAt, firstOfMonth),
          lte(transactions.processedAt, today),
        ),
      ),
    db
      .select({
        income: sql<number>`COALESCE(SUM(ABS(${transactions.transferAmount})), 0)`.as('income'),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.ownerId, userId),
          gte(transactions.transferAmount, 0),
          gt(transactions.processedAt, today),
          lte(transactions.processedAt, endOfMonth),
        ),
      ),
    db
      .select({
        expenses: sql<number>`COALESCE(SUM(ABS(${recurringPayments.transferAmount})), 0)`.as('expenses'),
      })
      .from(recurringPayments)
      .where(
        and(
          eq(recurringPayments.ownerId, userId),
          gte(recurringPayments.transferAmount, 0),
          gt(recurringPayments.executeAt, today.getDate()),
          lte(recurringPayments.executeAt, 31),
        ),
      ),
  ]);

  const paidExpenses = paidExpensesResult[0].expenses;
  const upcomingExpenses = upcomingTransactionsExpensesResult[0].expenses + upcomingRecurringExpensesResult[0].expenses;
  const receivedIncome = receivedIncomeResult[0].income;
  const upcomingIncome = upcomingTransactionIncomeResult[0].income + upcomingRecurringIncomeResult[0].expenses;
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

// REVISIT: Optimize the queries below for performance and cache the results where possible
budgetRouter.get(
  '/',
  validateRequest({
    query: z.object({
      search: z.string().optional(),
      from: z.coerce.number().optional(),
      to: z.coerce.number().optional(),
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
          count: sql<number>`count(*)`.as('count'),
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
        offset: req.query.from,
        limit: req.query.to ? req.query.to - (req.query.from || 0) : undefined,
        with: {
          categories: {
            with: {
              category: true,
            },
          },
        },
      }),
    ]);

    // Calculate balances for each budget
    const updatedBudgets = [] as ((typeof records)[number] & {balance: number})[];
    for await (const budget of records) {
      const budgetBalance = await calculateBudgetBalance(
        budget.ownerId,
        budget.type,
        budget.categories.map(c => c.categoryId),
      );

      updatedBudgets.push({
        ...budget,
        balance: budgetBalance,
      });
    }

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
    const record = await db.query.budgets.findMany({
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

    const budgetWithBalance: (typeof record)[number] & {balance: number} = {
      ...record[0],
      balance: await calculateBudgetBalance(
        record[0].id,
        record[0].type,
        record[0].categories.map(c => c.categoryId),
      ),
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
      const budgetBalance = await calculateBudgetBalance(
        userId,
        result.type,
        result.categories.map(c => c.categoryId),
      );
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

    try {
      const result = await db.transaction(async tx => {
        const [updatedBudget] = await tx
          .update(budgets)
          .set(budgetData)
          .where(and(eq(budgets.id, budgetId), eq(budgets.ownerId, userId)))
          .returning();

        if (!updatedBudget) {
          throw new Error('Budget not found or access denied');
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
      const budgetBalance = await calculateBudgetBalance(
        userId,
        result.type,
        result.categories.map(c => c.categoryId),
      );
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
        throw new Error('No budget deleted');
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

async function calculateBudgetBalance(ownerId: string, budgetType: 'i' | 'e', categories: string[]): Promise<number> {
  if (categories.length === 0) {
    return 0;
  }
  const today = new Date();
  const total = await db
    .select({
      total: sql<number>`SUM(COALESCE(${transactions.transferAmount}, 0)) * -1`.as('total'),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.ownerId, ownerId),
        budgetType === 'i'
          ? inArray(transactions.categoryId, categories)
          : notInArray(transactions.categoryId, categories),
        // Only consider transactions in the current month and as of today
        gte(transactions.processedAt, new Date(today.getFullYear(), today.getMonth(), 1)),
        lte(transactions.processedAt, today),
      ),
    );

  return total[0].total || 0;
}
