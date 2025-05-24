import {and, eq, notInArray, sql} from 'drizzle-orm';
import {z} from 'zod';

import {db} from '../db/drizzleClient';
import {
  Budgets,
  BudgetsCategories,
  Categories,
  type TBudget,
  type TBudgetCategory,
  type TInsertBudget,
  type TInsertBudgetCategory,
  type TUpdateBudget,
  Transactions,
  ZBudget,
  ZCategory,
  ZUpdateBudget,
} from '../db/schema';
import {Tables} from '../db/schema/general';
import {User} from '../models/User.model';
import {type ICRUDService} from './interfaces';
import {CRUDService} from './interfaces/CRUD.service';

export const ZBudgetProgress = z.object({
  id: ZBudget.shape.id,
  label: ZBudget.shape.label,
  type: ZBudget.shape.type,
  budgetAmount: ZBudget.shape.budgetAmount,
  budgetProgress: ZBudget.shape.budgetAmount,
  categories: z.array(
    z.object({
      id: ZCategory.shape.id,
      name: ZCategory.shape.name,
      description: ZCategory.shape.description,
    }),
  ),
});
export type TBudgetProgress = z.infer<typeof ZBudgetProgress>;

type TBudgetProgressRetrievalFilterCondition =
  | {type: 'owner'; owner: User['id']}
  | {type: 'owner_and_id'; owner: User['id']; id: TBudgetProgress['id']};

export class BudgetService
  extends CRUDService<typeof Budgets, TBudgetProgress>
  implements ICRUDService<TBudget['id'], TBudgetProgress, TUpdateBudget>
{
  constructor() {
    super(BudgetService.name, db, Budgets, Tables.BUDGETS);
  }

  private async retrieveBudgetsWithProgress<T extends TBudgetProgressRetrievalFilterCondition>(
    condition: T,
  ): Promise<
    TBudgetProgress[]
  > /*: Promise<T extends {type: 'owner'} ? TBudgetProgress[] : (TBudgetProgress | null)>*/ {
    const retrieveByOwner = condition.type === 'owner';
    const whereOwnerCondition = eq(Budgets.owner, condition.owner);
    const whereCondition = retrieveByOwner
      ? whereOwnerCondition
      : and(whereOwnerCondition, eq(BudgetsCategories.budgetId, condition.id));
    const results = await db
      .select({
        id: Budgets.id,
        label: Budgets.label,
        type: Budgets.type,
        budgetAmount: Budgets.budgetAmount,
        budgetProgress: sql`
          COALESCE((
            SELECT 
              SUM(${Transactions.transferAmount}) * -1
            FROM ${Transactions}
              WHERE ${Transactions.owner} = ${Budgets.owner}
                AND to_char(${Transactions.processedAt}, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')          
                  AND 
                    ${Budgets.type} = 'include'
                      AND ${Transactions.category} IN (SELECT ${BudgetsCategories.categoryId} FROM ${BudgetsCategories} WHERE ${BudgetsCategories.budgetId} = ${Budgets.id}) 
                  OR 
                    ${Budgets.type} = 'exclude'
                      AND ${Transactions.category} NOT IN (SELECT ${BudgetsCategories.categoryId} FROM ${BudgetsCategories} WHERE ${BudgetsCategories.budgetId} = ${Budgets.id})
                        AND to_char(${Transactions.processedAt}, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')          
          ), 0)
        `.as('budgetProgress'),
        categories: sql`
          COALESCE(
            json_agg(
              json_build_object(
                'id', ${Categories.id},
                'name', ${Categories.name},
                'description', ${Categories.description}
              )
            ) FILTER (WHERE ${Categories.id} IS NOT NULL),
            '[]'
          )
        `.as('categories'),
      })
      .from(Budgets)
      .leftJoin(BudgetsCategories, eq(Budgets.id, BudgetsCategories.budgetId))
      .leftJoin(Categories, eq(BudgetsCategories.categoryId, Categories.id))
      .where(whereCondition)
      .groupBy(Budgets.id);

    return results as TBudgetProgress[]; // FIXME: Parse and validate the results
  }

  // FIXME: Improve typing for the create method
  // @ts-expect-error
  async create(payload: object[], payloadSchema: z.ZodSchema<any>, user: User) {
    payload = payload.map(item => ({
      ...item,
      owner: user.id,
    }));

    const parsedPayload = z.array(payloadSchema).safeParse(payload);
    if (!parsedPayload.success) {
      this.log.error(`Failed to parse payload: ${parsedPayload.error}`);
      throw parsedPayload.error;
    }

    const budgetPayload: TInsertBudget[] = parsedPayload.data.map(budget => ({
      label: budget.label,
      type: budget.type,
      budgetAmount: budget.budgetAmount,
      owner: budget.owner,
    }));
    const budgetCategoriesPayload: TBudgetCategory['categoryId'][][] = parsedPayload.data.map(
      budget => budget.categories,
    );
    const createdBudgetIds = await this.db.transaction(async tx => {
      this.log.debug(`Creating record in ${this.tblName}`);
      const createdBudgets = await tx.insert(this.tbl).values(budgetPayload).returning();
      this.log.debug(`Created ${createdBudgets.length} records in ${this.tblName}`, createdBudgets);

      if (createdBudgets.length != budgetPayload.length) {
        // This throws an exception that rollbacks the transaction.
        tx.rollback();
        this.log.debug(`Not all records created in ${this.tblName}! Rolling back transaction...`);
        throw new Error('Not all records created');
      }

      // Create budget-subscription relations for the created budgets
      this.log.debug(`Creating budget-category relations for ${createdBudgets.length} budgets`, createdBudgets);
      createdBudgets.forEach((budget, idx) => {
        this.log.debug(`Creating budget-category relations for budget ID ${budget.id}`);
        const budgetId = budget.id;
        const categories = budgetCategoriesPayload[idx];

        if (!Array.isArray(categories) || categories.length === 0) {
          this.log.debug(`No categories provided for budget ID ${budgetId}, skipping relation creation`);
          return;
        }

        categories.forEach(async categoryId => {
          this.log.debug(`Creating relation for budget ID ${budgetId} and category ID ${categoryId}`);
          await tx.insert(BudgetsCategories).values({
            budgetId: budgetId,
            categoryId: categoryId,
          });
        });
      });

      return createdBudgets.map(budget => budget.id);
    });

    this.log.debug(`Created ${createdBudgetIds.length} budgets in ${this.tblName}`, createdBudgetIds);

    const budgets = await Promise.all(createdBudgetIds.map(id => this.getById(id)));
    this.log.debug(`Fetched created budgets from ${this.tblName}`, budgets);

    return budgets;
  }

  async getAll() {
    const data = await this.retrieveBudgetsWithProgress({
      type: 'owner',
      owner: 'YtIFh3GqktLaCmu5PqlLAdQc3JeEohIf',
    });
    this.log.debug(`Fetched records from ${this.tblName}`, data);
    // FIXME: Return actual data after updating the generic typings
    return data;
  }

  async getById(entityId: number) {
    const data = await this.retrieveBudgetsWithProgress({
      type: 'owner_and_id',
      owner: 'YtIFh3GqktLaCmu5PqlLAdQc3JeEohIf',
      id: entityId,
    });
    this.log.debug(`Fetched record with ID ${entityId} from ${this.tblName}`, data);
    return data.length > 0 ? data[0] : null;
  }

  async updateById(entityId: TBudget['id'], payload: object) {
    const parsedPayload = ZUpdateBudget.safeParse(payload);
    if (!parsedPayload.success) {
      this.log.error(`Failed to parse payload: ${parsedPayload.error}`);
      throw parsedPayload.error;
    }

    const data = parsedPayload.data;
    await this.db.transaction(async tx => {
      this.log.debug(`Updating record with ID ${entityId} in ${this.tblName}`);

      const result = await tx
        .update(this.tbl)
        .set({
          label: data.label,
          type: data.type,
          budgetAmount: data.budgetAmount,
        })
        .where(eq(this.tbl.id, entityId))
        .returning();
      this.log.debug(`Updated ${result.length} records in ${this.tblName}`);
      if (result.length > 1) {
        // This throws an exception that rollbacks the transaction.
        tx.rollback();
        this.log.debug(`More than one row updated in ${this.tblName}! Rolling back transaction...`);
        throw new Error('More than one row updated');
      }

      // Check budet categories
      const categories: number[] = data.categories ? data.categories.filter(num => num != undefined) : [];
      // Delete all existing budget-category relations for the budget which are not in this list
      // Do stuff...
      const deletedCategories = await tx
        .delete(BudgetsCategories)
        .where(and(eq(BudgetsCategories.budgetId, entityId), notInArray(BudgetsCategories.categoryId, categories)))
        .returning();

      this.log.debug(
        `Deleted ${deletedCategories.length} budget-category relations for budget ID ${entityId} in ${this.tblName}`,
        deletedCategories,
      );

      // Create new budget-category relations for the budget
      // Do stuff...
      const existingCategories = await tx
        .select()
        .from(BudgetsCategories)
        .where(eq(BudgetsCategories.budgetId, entityId));
      this.log.debug(
        `Found ${existingCategories.length} existing budget-category relations for budget ID ${entityId} in ${this.tblName}`,
        existingCategories,
      );
      const newCategories: number[] = categories.filter(
        categoryId => !existingCategories.some(existing => existing.categoryId === categoryId),
      );
      this.log.debug(
        `Found ${newCategories.length} new categories to add for budget ID ${entityId} in ${this.tblName}`,
        newCategories,
      );
      if (newCategories.length > 0) {
        const newRelations: TInsertBudgetCategory[] = newCategories.map(categoryId => ({
          budgetId: entityId,
          categoryId: categoryId,
        }));
        const createdCategories = await tx.insert(BudgetsCategories).values(newRelations).returning();
        this.log.debug(
          `Created ${createdCategories.length} new budget-category relations for budget ID ${entityId} in ${this.tblName}`,
          createdCategories,
        );
      }
    });

    // Return the updated budget
    this.log.debug(`Returning updated budget with ID ${entityId} from ${this.tblName}`);
    const updatedResult = await this.getById(entityId);

    return updatedResult;
  }

  async deleteById(entityId: TBudget['id']) {
    let deletedEntity = null;
    await this.db.transaction(async tx => {
      this.log.debug(`Deleting record with ID ${entityId} from ${this.tblName}`);
      const result = await tx.delete(this.tbl).where(eq(this.tbl.id, entityId)).returning();
      if (result.length > 1) {
        // This throws an exception that rollbacks the transaction.
        tx.rollback();
        this.log.debug(`More than one row deleted in ${this.tblName}! Rolling back transaction...`);
        throw new Error('More than one row deleted');
      }

      deletedEntity = result[0];
    });

    return deletedEntity;
  }
}
