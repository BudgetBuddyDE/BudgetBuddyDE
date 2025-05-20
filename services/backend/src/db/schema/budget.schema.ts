import {doublePrecision, integer, pgEnum, pgTable, varchar} from 'drizzle-orm/pg-core';
import {createInsertSchema, createSelectSchema} from 'drizzle-zod';
import {z} from 'zod';

import {Categories, ZInsertCategory} from './category.schema';
import {BaseColumns, OwnerColumn, Tables} from './general';

export const BudgetCategoryType = pgEnum('BudgetCategoryType', ['include', 'exclude']);

export const Budgets = pgTable(Tables.BUDGETS, {
  ...BaseColumns,
  ...OwnerColumn,
  label: varchar('label', {length: 120}).notNull(),
  type: BudgetCategoryType().notNull(),
  budgetAmount: doublePrecision('budgetAmount').notNull(),
});
export const ZBudget = createSelectSchema(Budgets);
export type TBudget = z.infer<typeof ZBudget>;

export const BudgetsCategories = pgTable(Tables.BUDGET_CATEGORIES, {
  budgetId: integer('budgetId')
    .references(() => Budgets.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  categoryId: integer('categoryId')
    .references(() => Categories.id, {
      onDelete: 'cascade',
    })
    .notNull(),
});
export const ZBudgetCategory = createSelectSchema(BudgetsCategories);
export type TBudgetCategory = z.infer<typeof ZBudgetCategory>;

/**
 * Schema for inserting an row into the `budget`-table
 */
export const ZInsertBudget = createInsertSchema(Budgets, {
  owner: owner => owner.nonempty(),
  label: string => string.nonempty(),
  type: BudgetCategoryType => BudgetCategoryType,
  budgetAmount: doublePrecision => doublePrecision,
});
export type TInsertBudget = z.infer<typeof ZInsertBudget>;

/**
 * Schema for inserating an row into the `budget_category`-table
 */
export const ZInsertBudgetCategory = createInsertSchema(BudgetsCategories, {
  budgetId: number => number.nonnegative(),
  categoryId: number => number.nonnegative(),
});
export type TInsertBudgetCategory = z.infer<typeof ZInsertBudgetCategory>;

/**
 * Schema for creating an budget
 */
export const ZCreateBudget = z.object({
  owner: ZInsertBudget.shape.owner,
  label: ZInsertBudget.shape.label,
  type: ZInsertBudget.shape.type,
  budgetAmount: ZInsertBudget.shape.budgetAmount,
  categories: z.array(ZInsertCategory.shape.id).optional(),
});
export type TCreateBudget = z.infer<typeof ZCreateBudget>;

export const ZUpdateBudget = z.object({
  budgetId: ZInsertBudget.shape.id,
  ...ZCreateBudget.shape,
});
export type TUpdateBudget = z.infer<typeof ZUpdateBudget>;
