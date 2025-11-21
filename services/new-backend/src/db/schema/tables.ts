import {boolean, doublePrecision, primaryKey, text, timestamp, uniqueIndex, uuid, varchar} from 'drizzle-orm/pg-core';
import {backendSchema} from './schema';

export const paymentMethods = backendSchema.table('payment_method', {
  id: uuid('payment_method_id').primaryKey().defaultRandom(),
  ownerId: varchar('owner_id').notNull(),
  name: varchar({length: 40}).notNull(),
  provider: varchar({length: 32}).notNull(),
  address: varchar({length: 32}).notNull(),
  description: text(),
  createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const categories = backendSchema.table('category', {
  id: uuid('category_id').primaryKey().defaultRandom(),
  ownerId: varchar('owner_id').notNull(),
  name: varchar({length: 40}).notNull(),
  description: text(),
  createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const transactions = backendSchema.table('transaction', {
  id: uuid('transaction_id').primaryKey().defaultRandom(),
  ownerId: varchar().notNull(),
  categoryId: uuid('category_id')
    .references(() => categories.id, {onDelete: 'cascade'})
    .notNull(),
  paymentMethodId: uuid('payment_method_id')
    .references(() => paymentMethods.id, {onDelete: 'cascade'})
    .notNull(),
  processedAt: timestamp('processed_at').notNull(),
  receiver: varchar({length: 100}).notNull(),
  transferAmount: doublePrecision('transfer_amount').notNull(),
  information: text(),
  createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const recurringPayments = backendSchema.table('recurring_payment', {
  id: uuid('recurring_payment_id').primaryKey().defaultRandom(),
  ownerId: varchar('owner_id').notNull(),
  categoryId: uuid('category_id')
    .references(() => categories.id, {onDelete: 'cascade'})
    .notNull(),
  paymentMethodId: uuid('payment_method_id')
    .references(() => paymentMethods.id, {onDelete: 'cascade'})
    .notNull(),
  executeAt: timestamp('execute_at').notNull(),
  paused: boolean().default(false).notNull(),
  receiver: varchar({length: 100}).notNull(),
  transferAmount: doublePrecision('transfer_amount').notNull(),
  information: text(),
  createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const budgetType = backendSchema.enum('budget_type', ['i', 'e']);

export const budgets = backendSchema.table('budget', {
  id: uuid('budget_id').primaryKey().defaultRandom(),
  ownerId: varchar('owner_id').notNull(),
  type: budgetType('type').notNull(),
  name: varchar({length: 32}).notNull(),
  budget: doublePrecision().notNull(),
  description: text(),
  createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const budgetCategories = backendSchema.table(
  'budget_category',
  {
    budgetId: uuid('budget_id')
      .notNull()
      .references(() => budgets.id, {onDelete: 'cascade'}),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, {onDelete: 'cascade'}),
  },
  table => [
    primaryKey({
      name: 'budget_category_pkey',
      columns: [table.budgetId, table.categoryId],
    }),
  ],
);

export const stockExchanges = backendSchema.table(
  'stock_exchange',
  {
    symbol: varchar('symbol', {length: 10}).primaryKey(),
    name: varchar('name', {length: 30}).notNull(),
    technicalName: varchar('technical_name', {length: 30}).notNull(),
    createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', {withTimezone: true})
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [uniqueIndex('stock_exchange_technical_name_idx').on(table.technicalName)],
);

export const stockPositions = backendSchema.table('stock_position', {
  id: uuid('stock_position_id').primaryKey().defaultRandom(),
  ownerId: varchar('owner_id').notNull(),
  stockExchangeSymbol: varchar('stock_exchange_symbol', {length: 3})
    .references(() => stockExchanges.symbol, {onDelete: 'restrict'})
    .notNull(),
  identifier: varchar({length: 12}).notNull(),
  quantity: doublePrecision().notNull(),
  purchasedAt: timestamp('purchased_at', {withTimezone: true}).notNull(),
  purchasePrice: doublePrecision('purchase_price').notNull(),
  purchaseFee: doublePrecision('purchase_fee').default(0).notNull(),
  information: text(),
  createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {withTimezone: true})
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
