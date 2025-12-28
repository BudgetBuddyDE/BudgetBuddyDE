import {and, eq, gte, inArray, lte, sql} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {z} from 'zod';
import {db} from '../db';
import {budgetCategories, categories, recurringPayments, transactions} from '../db/schema';
import {CategorySchemas} from '../db/schema/types';
import {logger} from '../lib';
import {ApiResponse, HTTPStatusCode} from '../models';
import {assembleFilter} from './assembleFilter';

export const categoryRouter = Router();

categoryRouter.post(
  '/merge',
  validateRequest({
    body: z.object({
      source: z.array(CategorySchemas.select.shape.id).transform(ids => new Set(ids)),
      target: CategorySchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const {source, target} = req.body;
    logger.info(`Merging categories for user ${userId}: source=${Array.from(source).join(', ')} -> target=${target}`);

    if (source.has(target)) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('Source categories cannot include the target category')
        .buildAndSend(res);
      return;
    }

    // Verify that all categories belong to the user
    const verifiedCategories = await db.query.categories.findMany({
      columns: {id: true},
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.ownerId, userId),
          operators.or(
            ...[...Array.from(source), target].map(id => operators.eq(fields.id, id)),
            operators.eq(fields.id, target),
          ),
        );
      },
    });

    if (verifiedCategories.length !== source.size + 1) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('One or more categories do not belong to the user or do not exist')
        .buildAndSend(res);
      return;
    }

    await db.transaction(async tx => {
      // Update transactions to point to the target category
      const updatedTransactions = await tx
        .update(transactions)
        .set({
          categoryId: target,
        })
        .where(and(eq(transactions.ownerId, userId), inArray(transactions.categoryId, Array.from(source))))
        .returning();

      logger.info(`Updated ${updatedTransactions.length} transactions to point to category ${target}`);

      // Update recurring payments to point to the target category
      const updatedRecurringPayments = await tx
        .update(recurringPayments)
        .set({
          categoryId: target,
        })
        .where(and(eq(recurringPayments.ownerId, userId), inArray(recurringPayments.categoryId, Array.from(source))))
        .returning();
      logger.info(`Updated ${updatedRecurringPayments.length} recurring payments to point to category ${target}`);

      // How can I prevent duplicate entries here?
      // Becuase an budget_category could have multiple source categories assigned to it that are now being merged into the target

      // Delete all budget categories associated with source categories and reassign to target
      const deletedBudgetCategories = await tx
        .delete(budgetCategories)
        .where(inArray(budgetCategories.categoryId, Array.from(source)))
        .returning();

      logger.info(`Deleted ${deletedBudgetCategories.length} budget categories associated with source categories`);

      if (deletedBudgetCategories.length > 0) {
        const uniqueBudgetIds = Array.from(new Set(deletedBudgetCategories.map(bc => bc.budgetId)));

        const createdBudgetCategories = await tx
          .insert(budgetCategories)
          .values(
            uniqueBudgetIds.map(budgetId => ({
              budgetId: budgetId,
              categoryId: target,
            })),
          )
          .returning();

        logger.info(`Created ${createdBudgetCategories.length} budget categories for target category ${target}`);
      } else logger.info('No budget categories needed to be reassigned to target category');

      // Delete source categories
      const deletedCategories = await tx
        .delete(categories)
        .where(and(eq(categories.ownerId, userId), inArray(categories.id, Array.from(source))))
        .returning();
      logger.info(`Deleted ${deletedCategories.length} source categories`);
    });

    ApiResponse.builder<{
      source: string[];
      target: string;
    }>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Categories merged successfully')
      .withData({
        source: Array.from(source),
        target,
      })
      .withFrom('db')
      .buildAndSend(res);
  },
);

categoryRouter.get(
  '/stats',
  validateRequest({
    query: z.object({
      from: z.coerce.date(),
      to: z.coerce.date(),
    }),
  }),
  async (req, res) => {
    const {from, to} = req.query;
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const results = await db
      .select({
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryDescription: categories.description,
        balance: sql<number>`sum(${transactions.transferAmount})`.as('balance'),
        income:
          sql<number>`SUM(CASE WHEN ${transactions.transferAmount} > 0 THEN ${transactions.transferAmount} ELSE 0 END)`.as(
            'income',
          ),
        expenses:
          sql<number>`SUM(CASE WHEN ${transactions.transferAmount} < 0 THEN ABS(${transactions.transferAmount}) ELSE 0 END)`.as(
            'expenses',
          ),
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(eq(transactions.ownerId, userId), gte(transactions.processedAt, from), lte(transactions.processedAt, to)),
      )
      .groupBy(transactions.ownerId, transactions.categoryId, categories.name, categories.description);

    ApiResponse.builder()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's category stats successfully")
      .withData({
        from,
        to,
        stats: results.map(row => ({
          balance: row.balance,
          income: row.income,
          expenses: row.expenses,
          category: {
            id: row.categoryId,
            name: row.categoryName,
            description: row.categoryDescription,
          },
        })),
      })
      .withFrom('db')
      .buildAndSend(res);
  },
);

categoryRouter.get(
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
      categories,
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
        .from(categories)
        .where(filter)
        .limit(1),
      db.query.categories.findMany({
        where() {
          return filter;
        },
        orderBy(fields, operators) {
          return [operators.desc(fields.updatedAt)];
        },
        offset: req.query.from,
        limit: req.query.to ? req.query.to - (req.query.from || 0) : undefined,
      }),
    ]);

    ApiResponse.builder<typeof records>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's categories successfully")
      .withData(records)
      .withTotalCount(totalCount)
      .withFrom('db')
      .buildAndSend(res);
  },
);

categoryRouter.get(
  '/:id',
  validateRequest({
    params: z.object({
      id: CategorySchemas.select.shape.id,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const entityId = req.params.id;
    const record = await db.query.categories.findFirst({
      where(fields, operators) {
        return operators.and(operators.eq(fields.ownerId, userId), operators.eq(fields.id, entityId));
      },
    });

    if (!record) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage(`Category ${entityId} not found`)
        .withFrom('db')
        .buildAndSend(res);
      return;
    }

    ApiResponse.builder<typeof record>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's category successfully")
      .withData(record)
      .withFrom('db')
      .buildAndSend(res);
  },
);

categoryRouter.post(
  '/',
  validateRequest({
    body: CategorySchemas.insert.omit({ownerId: true}).extend({
      ownerId: CategorySchemas.insert.shape.ownerId.optional(),
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
      return body as z.infer<typeof CategorySchemas.insert>;
    });

    try {
      const createdRecords = await db.insert(categories).values(requestBody).returning();
      if (createdRecords.length === 0) {
        throw new Error('No category created');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Category created successfully')
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

categoryRouter.put(
  '/:id',
  validateRequest({
    params: z.object({
      id: CategorySchemas.select.shape.id,
    }),
    body: CategorySchemas.update.omit({ownerId: true}).extend({
      ownerId: CategorySchemas.update.shape.ownerId.optional(),
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
      const updatedRecords = await db
        .update(categories)
        .set(requestBody)
        .where(and(eq(categories.ownerId, userId), eq(categories.id, req.params.id)))
        .returning();

      if (updatedRecords.length === 0) {
        throw new Error('No category updated');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Category updated successfully')
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

categoryRouter.delete(
  '/:id',
  validateRequest({
    params: z.object({
      id: CategorySchemas.select.shape.id,
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
        .delete(categories)
        .where(and(eq(categories.ownerId, userId), eq(categories.id, entityId)))
        .returning();

      if (deletedRecord.length === 0) {
        throw new Error('No category deleted');
      }
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Category deleted successfully')
        .withFrom('db')
        .buildAndSend(res);
    } catch (err) {
      ApiResponse.builder()
        .fromError(err instanceof Error ? err : new Error(String(err)))
        .buildAndSend(res);
    }
  },
);
