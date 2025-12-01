import {and, eq, inArray, sql} from 'drizzle-orm';
import {Router} from 'express';
import validateRequest from 'express-zod-safe';
import z from 'zod';
import {db} from '../db';
import {budgetCategories, budgets} from '../db/schema/tables';
import {BudgetWithCategoriesSchema} from '../db/schema/types';
import {ApiResponse, HTTPStatusCode} from '../models';
import {assembleFilter} from './assembleFilter';

export const budgetRouter = Router();

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

    ApiResponse.builder<typeof records>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's budgets successfully")
      .withData(records)
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

    ApiResponse.builder<typeof record>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage("Fetched user's budget successfully")
      .withData(record)
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

      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Budget created successfully')
        .withData(result)
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

      ApiResponse.builder()
        .withStatus(HTTPStatusCode.OK)
        .withMessage('Budget updated successfully')
        .withData(result)
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
