import {doublePrecision, integer, pgEnum, pgTable, varchar} from 'drizzle-orm/pg-core';
import {createSelectSchema} from 'drizzle-zod';
import {z} from 'zod';

import {Categories} from './category.schema';
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
