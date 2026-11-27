import {ConfirmCategoryDeletion} from '@budgetbuddyde/api/category';
import {
  budgetCategories,
  CategorySchemas,
  categories,
  recurringPayments,
  transactionChildHistoryView,
  transactionRootHistoryView,
  transactions,
} from '@budgetbuddyde/db/backend';
import {and, eq, gte, inArray, lt, lte, sql} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import {z} from 'zod';
import {db} from '../db';
import {applyBatchUpdates, createBatchSchema, hasAllOwnedIds, ownedIdsFinder, updateBatchSchema} from './batch';
import {paginationFields} from './pagination';
import {invalidateDomainMutation} from '../domain/cache';
import * as categoryDomain from '../domain/category';
import {categoryWriteError, checkExpectedCategoryParent, lockCategoryHierarchy} from '../domain/categoryHierarchy';
import {sendDomainResponse} from '../domain/response';
import {logger} from '../lib';
import {ApiResponse, HTTPStatusCode} from '../models';

export const categoryRouter = Router();

categoryRouter.post(
  '/merge',
  validateRequest({
    body: z.object({
      source: z
        .array(CategorySchemas.select.shape.id)
        .min(1)
        .transform(ids => new Set(ids)),
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

    const merged = await db.transaction(async tx => {
      await lockCategoryHierarchy(tx, userId);
      const verified = await tx
        .select({id: categories.id})
        .from(categories)
        .where(and(eq(categories.ownerId, userId), inArray(categories.id, [...sourceArray, target])))
        .orderBy(categories.id)
        .for('update');
      if (verified.length !== source.size + 1)
        return 'One or more categories do not belong to the user or do not exist';
      const [child] = await tx
        .select({id: categories.id})
        .from(categories)
        .where(and(eq(categories.ownerId, userId), inArray(categories.parentId, sourceArray)))
        .limit(1);
      if (child) return 'Categories with children cannot be merge sources';
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
        .where(and(eq(budgetCategories.ownerId, userId), inArray(budgetCategories.categoryId, sourceArray)))
        .returning();

      if (deletedBudgetCategories.length > 0) {
        const affectedBudgetIds = [...new Set(deletedBudgetCategories.map(bc => bc.budgetId))];

        // Find which budgets already have the target category
        const existingTargetBudgets = await tx
          .select({budgetId: budgetCategories.budgetId})
          .from(budgetCategories)
          .where(
            and(
              eq(budgetCategories.ownerId, userId),
              inArray(budgetCategories.budgetId, affectedBudgetIds),
              eq(budgetCategories.categoryId, target),
            ),
          );

        const existingBudgetIds = new Set(existingTargetBudgets.map(b => b.budgetId));
        const budgetsNeedingTarget = affectedBudgetIds.filter(id => !existingBudgetIds.has(id));

        if (budgetsNeedingTarget.length > 0) {
          await tx
            .insert(budgetCategories)
            .values(budgetsNeedingTarget.map(budgetId => ({ownerId: userId, budgetId, categoryId: target})))
            .onConflictDoNothing();

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
      return null;
    });
    if (merged) {
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage(merged).buildAndSend(res);
      return;
    }
    await invalidateDomainMutation(userId, '/api/category');

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
    query: z
      .object({
        from: z.string(),
        to: z.string(),
        level: z.enum(['root', 'child']).optional(),
        exact: z.enum(['true']).optional(),
      })
      .superRefine((query, ctx) => {
        for (const field of ['from', 'to'] as const) {
          const schema = query.exact ? z.iso.date() : z.coerce.date();
          if (!schema.safeParse(query[field]).success)
            ctx.addIssue({code: 'custom', path: [field], message: 'Invalid date bound'});
        }
      })
      .transform(query => ({...query, from: new Date(query.from), to: new Date(query.to)})),
  }),
  async (req, res) => {
    const {from, to, level, exact} = req.query;
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const monthKey = (date: Date) => date.getUTCFullYear() * 12 + date.getUTCMonth() + 1;
    const history = level === 'root' ? transactionRootHistoryView : transactionChildHistoryView;
    const historyName = sql.identifier(
      level === 'root' ? 'transaction_root_history_view' : 'transaction_child_history_view',
    );
    const period = sql<number>`(${history.year} * 12 + ${history.month})`;
    const results =
      level === 'root' && exact
        ? await db
            .select({
              categoryId: sql<string>`coalesce(${categories.parentId}, ${categories.id})`,
              categoryName: sql<string>`coalesce(parent.name, ${categories.name})`,
              categoryDescription: sql<
                string | null
              >`case when parent.category_id is null then ${categories.description} else parent.description end`,
              balance: sql<number>`sum(${transactions.transferAmount})`,
              income: sql<number>`sum(greatest(${transactions.transferAmount}, 0))`,
              expenses: sql<number>`sum(greatest(-${transactions.transferAmount}, 0))`,
            })
            .from(transactions)
            .innerJoin(categories, and(eq(transactions.categoryId, categories.id), eq(categories.ownerId, userId)))
            .leftJoin(
              sql`${categories} as parent`,
              sql`parent.category_id = ${categories.parentId} and parent.owner_id = ${categories.ownerId}`,
            )
            .where(
              and(
                eq(transactions.ownerId, userId),
                gte(transactions.processedAt, from),
                lt(transactions.processedAt, new Date(to.getTime() + 86_400_000)),
              ),
            )
            .groupBy(sql`1, 2, 3`)
        : level
          ? await db
              .select({
                categoryId: categories.id,
                categoryName: categories.name,
                categoryDescription: categories.description,
                balance: sql<number>`sum(${history.balance})`,
                income: sql<number>`sum(${history.income})`,
                expenses: sql<number>`sum(${history.expenses})`,
              })
              .from(history)
              .innerJoin(
                categories,
                and(sql`${categories.id} = ${historyName}.category_id`, eq(categories.ownerId, userId)),
              )
              .where(and(eq(history.ownerId, userId), gte(period, monthKey(from)), lte(period, monthKey(to))))
              .groupBy(categories.id, categories.name, categories.description)
          : await db
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
                and(
                  eq(transactions.ownerId, userId),
                  gte(transactions.processedAt, from),
                  lte(transactions.processedAt, to),
                ),
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
  '/:id/breakdown',
  validateRequest({params: z.object({id: CategorySchemas.select.shape.id}), query: z.object({month: z.iso.date()})}),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const result = await categoryDomain.getMonthlyBreakdown(userId, req.params.id, req.query.month);
    sendDomainResponse(res, result);
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
        await lockCategoryHierarchy(tx, userId);
        const records = await tx
          .insert(categories)
          .values(req.body.map(body => ({...body, ownerId: userId})))
          .returning();
        if (records.length !== req.body.length)
          throw new Error('Batch category create returned an unexpected row count');
        return records;
      });
      await invalidateDomainMutation(userId, '/api/category');
      sendDomainResponse(
        res,
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.OK)
          .withMessage('Categories created successfully')
          .withData(createdRecords)
          .withFrom('db')
          .build(),
      );
    } catch (err) {
      sendDomainResponse(res, categoryWriteError(err));
    }
  },
);

categoryRouter.put(
  '/batch',
  validateRequest({
    body: updateBatchSchema(
      CategorySchemas.select.shape.id.transform(id => id.toLowerCase()),
      categoryDomain.categoryUpdateSchema.refine(
        body => body.parentId === undefined || body.expectedParentId !== undefined,
        {
          message: 'Batch moves must specify the expected parent',
          path: ['expectedParentId'],
        },
      ),
    ),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }

    const {updates} = req.body;
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
      const updatedRecords = await db.transaction(async tx => {
        if (updates.some(update => update.data.parentId !== undefined)) await lockCategoryHierarchy(tx, userId);
        return applyBatchUpdates(
          tx,
          updates,
          async (transaction, update) => {
            const {expectedParentId, ...changes} = update.data;
            if (expectedParentId !== undefined) {
              await checkExpectedCategoryParent(transaction, userId, update.id, expectedParentId);
            }
            const [record] = await transaction
              .update(categories)
              .set({...changes, updatedAt: new Date()})
              .where(and(eq(categories.ownerId, userId), eq(categories.id, update.id)))
              .returning();
            return record;
          },
          update => `Category ${update.id} could not be updated`,
        );
      });
      await invalidateDomainMutation(userId, '/api/category');
      sendDomainResponse(
        res,
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.OK)
          .withMessage('Categories updated successfully')
          .withData(updatedRecords)
          .withFrom('db')
          .build(),
      );
    } catch (err) {
      sendDomainResponse(res, categoryWriteError(err));
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
    body: categoryDomain.categoryUpdateSchema,
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
    body: ConfirmCategoryDeletion.partial(),
  }),
  async (req, res) => {
    const userId = req.context.user?.id;
    if (!userId) {
      ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
      return;
    }
    const result = await categoryDomain.remove(userId, req.params.id, req.body.confirmedChildIds);
    sendDomainResponse(res, result);
  },
);
