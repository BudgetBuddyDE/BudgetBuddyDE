import { doublePrecision, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { backendSchema } from './schema';
import { relations, sql } from 'drizzle-orm';

export const stockExchanges = backendSchema.table(
  'stock_exchange',
  {
    symbol: varchar('symbol', { length: 10 }).primaryKey(),
    name: varchar('name', { length: 30 }).notNull(),
    technicalName: varchar('technical_name', { length: 30 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('stock_exchange_technical_name_idx').on(table.technicalName)]
);

export const stockPositions = backendSchema.table('stock_position', {
  id: uuid('stock_position_id').primaryKey().defaultRandom(),
  ownerId: varchar('owner_id').notNull(),
  stockExchangeSymbol: varchar('stock_exchange_symbol', { length: 3 })
    .references(() => stockExchanges.symbol)
    .notNull(),
  identifier: varchar({ length: 12 }).notNull(),
  quantity: doublePrecision().notNull(),
  purchasedAt: timestamp('purchased_at', { withTimezone: true }).notNull(),
  purchasePrice: doublePrecision('purchase_price').notNull(),
  purchaseFee: doublePrecision('purchase_fee').default(0).notNull(),
  information: text(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const stockPositionRelations = relations(stockPositions, ({ one }) => ({
  stockExchanges: one(stockExchanges, {
    fields: [stockPositions.stockExchangeSymbol],
    references: [stockExchanges.symbol],
  }),
}));

export const stockPositionView = backendSchema.view('stock_position_grouped').as((qb) =>
  qb
    .select({
      ownerId: stockPositions.ownerId,
      identifier: stockPositions.identifier,
      stockExchangeSymbol: stockPositions.stockExchangeSymbol,
      totalQuantity: sql`SUM(${stockPositions.quantity})`.as('total_quantity'),
      totalPurchasePrice: sql`SUM(${stockPositions.purchasePrice})`.as('total_purchase_price'),
      totalPurchaseFee: sql`SUM(${stockPositions.purchaseFee})`.as('total_purchase_fee'),
    })
    .from(stockPositions)
    .groupBy(stockPositions.ownerId, stockPositions.identifier, stockPositions.stockExchangeSymbol)
);
