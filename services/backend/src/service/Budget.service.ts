import {and, eq, sql} from 'drizzle-orm';
import {z} from 'zod';

import {db} from '../db/drizzleClient';
import {
  Budgets,
  BudgetsCategories,
  Categories,
  type TBudget,
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

  async updateById(entityId: TBudget['id'], entites: TUpdateBudget) {
    const parsedPayload = ZUpdateBudget.safeParse(entites);
    if (!parsedPayload.success) {
      this.log.error(`Failed to parse payload: ${parsedPayload.error}`);
      throw parsedPayload.error;
    }

    let updatedEntity = null;
    await this.db.transaction(async tx => {
      this.log.debug(`Updating record with ID ${entityId} in ${this.tblName}`);
      const result = await this.db
        .update(this.tbl)
        .set(parsedPayload.data)
        .where(eq(this.tbl.id, entityId))
        .returning();
      this.log.debug(`Updated ${result.length} records in ${this.tblName}`);
      if (result.length > 1) {
        // This throws an exception that rollbacks the transaction.
        tx.rollback();
        this.log.debug(`More than one row updated in ${this.tblName}! Rolling back transaction...`);
        throw new Error('More than one row updated');
      }

      updatedEntity = result[0];
    });

    return updatedEntity;
  }

  async deleteById(entityId: TBudget['id']) {
    let deletedEntity = null;
    await this.db.transaction(async tx => {
      this.log.debug(`Deleting record with ID ${entityId} from ${this.tblName}`);
      const result = await this.db.delete(this.tbl).where(eq(this.tbl.id, entityId)).returning();
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
