import {effectiveCategoryIds} from '@budgetbuddyde/api/category';
import {
  BudgetWithCategoriesSchema,
  budgetCategories,
  budgets,
  categories,
  transactionHistoryView,
} from '@budgetbuddyde/db/backend';
import {and, eq, inArray, sql} from 'drizzle-orm';
import {z} from 'zod';
import {db} from '../db';
import {ApiResponse, HTTPStatusCode, NotFoundError} from '../models';
import {invalidateDomainMutation} from './cache';
import {normalizeResponse} from './response';
import {assembleFilter} from '../router/assembleFilter';
import {hasAllOwnedIds, ownedIdsFinder} from '../router/batch';
import {paginationFields, paginationWindow, refinePagination} from '../router/pagination';

const listSchema = z
  .object({search: z.string().optional(), month: z.iso.date().optional(), ...paginationFields})
  .superRefine(refinePagination);
const createSchema = BudgetWithCategoriesSchema.insert
  .omit({ownerId: true})
  .extend({ownerId: BudgetWithCategoriesSchema.insert.shape.ownerId.optional()});
const updateSchema = BudgetWithCategoriesSchema.update
  .omit({ownerId: true})
  .extend({ownerId: BudgetWithCategoriesSchema.update.shape.ownerId.optional()});

export async function list(userId: string, queryInput: z.input<typeof listSchema> = {}) {
  const parsed = listSchema.safeParse(queryInput);
  if (!parsed.success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  const query = parsed.data;
  return normalizeResponse(
    await (async () => {
      const filter = assembleFilter(
        budgets,
        {ownerColumnName: 'ownerId', ownerValue: userId},
        {
          searchTerm: query.search,
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
          ...paginationWindow(query),
          with: {
            categories: {
              with: {
                category: true,
              },
            },
          },
        }),
      ]);

      const balances = await calculateBudgetBalances(
        userId,
        records,
        query.month ? new Date(`${query.month}T12:00:00`) : undefined,
      );
      const updatedBudgets = records.map((budget, index) => ({
        ...budget,
        balance: balances[index],
      }));

      return ApiResponse.builder<typeof updatedBudgets>()
        .withStatus(HTTPStatusCode.OK)
        .withMessage("Fetched user's budgets successfully")
        .withData(updatedBudgets)
        .withTotalCount(totalCount)
        .withFrom('db')
        .build();
    })(),
  );
}

export async function get(userId: string, id: string) {
  if (!BudgetWithCategoriesSchema.select.shape.id.safeParse(id).success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  return normalizeResponse(
    await (async () => {
      const entityId = id;
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
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.NOT_FOUND)
          .withMessage(`Budget ${entityId} not found`)
          .withFrom('db')
          .build();
      }

      const [balance] = await calculateBudgetBalances(userId, [record]);
      const budgetWithBalance: typeof record & {balance: number} = {
        ...record,
        balance,
      };

      return ApiResponse.builder<typeof budgetWithBalance>()
        .withStatus(HTTPStatusCode.OK)
        .withData(budgetWithBalance)
        .withMessage("Fetched user's budget successfully")
        .withFrom('db')
        .build();
    })(),
  );
}

export async function create(userId: string, body: z.input<typeof createSchema>) {
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  const input = parsed.data;
  const result = normalizeResponse(
    await (async () => {
      const {categories: categoryIds, ...budgetData} = input;
      const newBudget = {...budgetData, ownerId: userId};

      if (!(await hasAllOwnedIds(userId, categoryIds, ownedIdsFinder(db.query.categories)))) {
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.BAD_REQUEST)
          .withMessage('One or more referenced categories are invalid')
          .build();
      }

      try {
        const result = await db.transaction(async tx => {
          const [createdBudget] = await tx.insert(budgets).values(newBudget).returning();

          if (categoryIds && categoryIds.length > 0) {
            const budgetCategoryLinks = categoryIds.map(catId => ({
              budgetId: createdBudget.id,
              ownerId: userId,
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
            .build();
        }
        const [budgetBalance] = await calculateBudgetBalances(userId, [result]);
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.OK)
          .withMessage('Budget created successfully')
          .withData({
            ...result,
            balance: budgetBalance,
          })
          .withFrom('db')
          .build();
      } catch (err) {
        return ApiResponse.builder()
          .fromError(err instanceof Error ? err : new Error(String(err)))
          .build();
      }
    })(),
  );
  if (result.status < 400) await invalidateDomainMutation(userId, '/api/budget');
  return result;
}

export async function update(userId: string, id: string, body: Partial<z.input<typeof updateSchema>>) {
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success || !BudgetWithCategoriesSchema.select.shape.id.safeParse(id).success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  const input = parsed.data;
  const result = normalizeResponse(
    await (async () => {
      const budgetId = id;
      const {categories: newCategoryIds, ...budgetData} = input;

      if (
        newCategoryIds !== undefined &&
        !(await hasAllOwnedIds(userId, newCategoryIds, ownedIdsFinder(db.query.categories)))
      ) {
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.BAD_REQUEST)
          .withMessage('One or more referenced categories are invalid')
          .build();
      }

      try {
        const result = await db.transaction(async tx => {
          const [updatedBudget] = await tx
            .update(budgets)
            .set({...budgetData, ownerId: userId})
            .where(and(eq(budgets.id, budgetId), eq(budgets.ownerId, userId)))
            .returning();

          if (!updatedBudget) {
            throw new NotFoundError('Budget not found');
          }

          if (newCategoryIds !== undefined) {
            const existingLinks = await tx
              .select()
              .from(budgetCategories)
              .where(eq(budgetCategories.budgetId, budgetId));

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
                  ownerId: userId,
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
            .build();
        }
        const [budgetBalance] = await calculateBudgetBalances(userId, [result]);
        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.OK)
          .withMessage('Budget updated successfully')
          .withData({
            ...result,
            balance: budgetBalance,
          })
          .withFrom('db')
          .build();
      } catch (err) {
        return ApiResponse.builder()
          .fromError(err instanceof Error ? err : new Error(String(err)))
          .build();
      }
    })(),
  );
  if (result.status < 400) await invalidateDomainMutation(userId, '/api/budget');
  return result;
}

export async function remove(userId: string, id: string) {
  if (!BudgetWithCategoriesSchema.select.shape.id.safeParse(id).success)
    return normalizeResponse(
      ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid request').build(),
    );
  const result = normalizeResponse(
    await (async () => {
      const entityId = id;

      try {
        const deletedRecord = await db
          .delete(budgets)
          .where(and(eq(budgets.ownerId, userId), eq(budgets.id, entityId)))
          .returning();

        if (deletedRecord.length === 0) {
          throw new NotFoundError('Budget not found');
        }

        return ApiResponse.builder()
          .withStatus(HTTPStatusCode.OK)
          .withMessage('Budget deleted successfully')
          .withFrom('db')
          .build();
      } catch (err) {
        return ApiResponse.builder()
          .fromError(err instanceof Error ? err : new Error(String(err)))
          .build();
      }
    })(),
  );
  if (result.status < 400) await invalidateDomainMutation(userId, '/api/budget');
  return result;
}

type TBudgetBalanceTarget = {
  type: 'i' | 'e';
  categories: readonly {categoryId: string}[];
};

/**
 * Computes monthly balances for multiple budgets with a single grouped query.
 *
 * Type `i` sums net expenses of assigned categories; type `e` sums all other
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
      parentId: categories.parentId,
      balance: sql<number>`COALESCE(SUM(${transactionHistoryView.balance}), 0)`.as('balance'),
    })
    .from(transactionHistoryView)
    .leftJoin(categories, and(eq(categories.id, transactionHistoryView.categoryId), eq(categories.ownerId, ownerId)))
    .where(
      and(
        eq(transactionHistoryView.ownerId, ownerId),
        eq(transactionHistoryView.month, currentMonth),
        eq(transactionHistoryView.year, currentYear),
      ),
    )
    .groupBy(sql`${transactionHistoryView.categoryId}, ${categories.parentId}`);

  const netExpensesByCategory = new Map<string, {netExpenses: number; parentId: string | null}>();
  let totalNetExpenses = 0;
  for (const row of rows) {
    if (row.categoryId === null) continue;
    const netExpenses = -row.balance;
    netExpensesByCategory.set(row.categoryId, {netExpenses, parentId: row.parentId});
    totalNetExpenses += netExpenses;
  }

  const membership = rows.flatMap(row => (row.categoryId ? [{id: row.categoryId, parentId: row.parentId}] : []));
  return budgets.map(budget => {
    const selected = effectiveCategoryIds(
      budget.categories.map(category => category.categoryId),
      membership,
    );
    if (selected.size === 0) return 0;
    let assignedNetExpenses = 0;
    for (const [id, {netExpenses}] of netExpensesByCategory) {
      if (selected.has(id)) assignedNetExpenses += netExpenses;
    }
    return Math.max(0, budget.type === 'i' ? assignedNetExpenses : totalNetExpenses - assignedNetExpenses);
  });
}
