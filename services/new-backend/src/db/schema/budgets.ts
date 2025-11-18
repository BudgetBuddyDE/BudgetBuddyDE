import { varchar, uuid, timestamp, text, doublePrecision, primaryKey } from 'drizzle-orm/pg-core';
import { categories } from './categories';
import { relations } from 'drizzle-orm';
import { backendSchema } from './schema';

export const budgetType = backendSchema.enum('budget_type', ['i', 'e']);

export const budgets = backendSchema.table('budgets', {
  id: uuid('budget_id').primaryKey().defaultRandom(),
  ownerId: varchar('owner_id').notNull(),
  type: budgetType('type').notNull(),
  name: varchar({ length: 32 }).notNull(),
  budget: doublePrecision().notNull(),
  description: text(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const budgetCategories = backendSchema.table(
  'budget_category',
  {
    budgetId: uuid('budget_id')
      .notNull()
      .references(() => budgets.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      name: 'budget_category_pkey',
      columns: [table.budgetId, table.categoryId],
    }),
  ]
);

export const budgetCategoryRelations = relations(budgetCategories, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetCategories.budgetId],
    references: [budgets.id],
  }),
  category: one(categories, {
    fields: [budgetCategories.categoryId],
    references: [categories.id],
  }),
}));
