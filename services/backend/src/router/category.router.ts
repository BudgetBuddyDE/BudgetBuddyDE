import {
  budgetCategories,
  CategorySchemas,
  categories,
  recurringPayments,
  transactions,
} from '@budgetbuddyde/db/backend';
import {and, eq, gte, inArray, lte, sql} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {z} from 'zod';
import {db} from '../db';
import {applyBatchUpdates, createBatchSchema, hasAllOwnedIds, ownedIdsFinder, updateBatchSchema} from './batch';
import {paginationFields} from './pagination';
import * as categoryDomain from '../domain/category';
import {sendDomainResponse} from '../domain/response';
import {logger} from '../lib';
import {ApiResponse, HTTPStatusCode} from '../models';

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
    const sourceArray = Array.from(source);

    logger.info(`Merging categories for user ${userId}: source=[${sourceArray.join(', ')}] -> target=${target}`);

    if (source.has(target)) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.BAD_REQUEST)
        .withMessage('Source categories cannot include the target category')
        .buildAndSend(res);
      return;
    }

    // Verify that all categories belong to the user
    const allCategoryIds = [...sourceArray, target];
    const verifiedCategories = await db.query.categories.findMany({
      columns: {id: true},
      where(fields, operators) {
        return operators.and(operators.eq(fields.ownerId, userId), operators.inArray(fields.id, allCategoryIds));
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
      // Parallel updates for transactions and recurring payments
      const [updatedTransactions, updatedRecurringPayments] = await Promise.all([
        tx
          .update(transactions)
          .set({categoryId: target})
          .where(and(eq(transactions.ownerId, userId), inArray(transactions.categoryId, sourceArray)))
          .returning(),
        tx
          .update(recurringPayments)
          .set({categoryId: target})
          .where(and(eq(recurringPayments.ownerId, userId), inArray(recurringPayments.categoryId, sourceArray)))
          .returning(),
      ]);

      logger.info(
        `Updated ${updatedTransactions.length} transactions and ${updatedRecurringPayments.length} recurring payments to category ${target}`,
      );

      // Handle budget categories: delete old, create new (avoiding duplicates)
      const deletedBudgetCategories = await tx
        .delete(budgetCategories)
        .where(inArray(budgetCategories.categoryId, sourceArray))
        .returning();

      if (deletedBudgetCategories.length > 0) {
        const affectedBudgetIds = [...new Set(deletedBudgetCategories.map(bc => bc.budgetId))];

        // Find which budgets already have the target category
        const existingTargetBudgets = await tx
          .select({budgetId: budgetCategories.budgetId})
          .from(budgetCategories)
          .where(and(inArray(budgetCategories.budgetId, affectedBudgetIds), eq(budgetCategories.categoryId, target)));

        const existingBudgetIds = new Set(existingTargetBudgets.map(b => b.budgetId));
        const budgetsNeedingTarget = affectedBudgetIds.filter(id => !existingBudgetIds.has(id));

        if (budgetsNeedingTarget.length > 0) {
          await tx
            .insert(budgetCategories)
            .values(budgetsNeedingTarget.map(budgetId => ({budgetId, categoryId: target})));

          logger.info(
            `Reassigned ${budgetsNeedingTarget.length} budgets to target category (${deletedBudgetCategories.length} entries deleted, ${existingBudgetIds.size} already had target)`,
          );
        } else {
          logger.info(`All ${affectedBudgetIds.length} affected budgets already have target category assigned`);
        }
      }

      // Delete source categories
      await tx.delete(categories).where(and(eq(categories.ownerId, userId), inArray(categories.id, sourceArray)));

      logger.info(`Successfully merged ${sourceArray.length} categories into ${target}`);
    });

    ApiResponse.builder<{source: string[]; target: string}>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Categories merged successfully')
      .withData({source: sourceArray, target})
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
      ...paginationFields,
    }),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const result = await categoryDomain.list(userId, req.query);
    sendDomainResponse(res, result);
  },
);

categoryRouter.post(
  '/batch',
  validateRequest({
    body: createBatchSchema(CategorySchemas.insert.omit({ownerId: true})),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    try {
      const createdRecords = await db.transaction(async tx => {
        const records = await tx
          .insert(categories)
          .values(req.body.map(body => ({...body, ownerId: userId})))
          .returning();
        if (records.length !== req.body.length)
          throw new Error('Batch category create returned an unexpected row count');
        return records;
      });
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Categories created successfully')
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
  '/batch',
  validateRequest({
    body: updateBatchSchema(
      CategorySchemas.select.shape.id,
      CategorySchemas.update.omit({ownerId: true, id: true, createdAt: true, updatedAt: true}),
    ),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const updates = req.body.updates as Array<{id: string; data: z.infer<typeof CategorySchemas.update>}>;
    const ids = updates.map(update => update.id);
    const owned = await hasAllOwnedIds(userId, ids, ownedIdsFinder(db.query.categories));
    if (!owned) {
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.NOT_FOUND)
        .withMessage('One or more categories were not found')
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
              .update(categories)
              .set({...update.data, ownerId: userId})
              .where(and(eq(categories.ownerId, userId), eq(categories.id, update.id)))
              .returning();
            return record;
          },
          update => `Category ${update.id} could not be updated`,
        ),
      );
      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Categories updated successfully')
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
    const result = await categoryDomain.get(userId, req.params.id);
    sendDomainResponse(res, result);
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
    const result = await categoryDomain.create(userId, req.body);
    sendDomainResponse(res, result);
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
    const result = await categoryDomain.update(userId, req.params.id, req.body);
    sendDomainResponse(res, result);
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
    const result = await categoryDomain.remove(userId, req.params.id);
    sendDomainResponse(res, result);
  },
);
