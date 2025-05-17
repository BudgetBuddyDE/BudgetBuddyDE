import {doublePrecision, integer, pgTable, timestamp, varchar} from 'drizzle-orm/pg-core';
import {createInsertSchema, createSelectSchema} from 'drizzle-zod';
import {z} from 'zod';

import {BaseColumns, CreatedAtColumn, DescriptionColumn, OwnerColumn, Tables, UpdatedAtColumn} from './general';

export const StockExchanges = pgTable(Tables.STOCK_EXCHANGES, {
  symbol: varchar('symbol', {length: 11}).primaryKey(),
  name: varchar('name', {length: 30}).notNull(),
  ...DescriptionColumn,
  ...CreatedAtColumn,
  ...UpdatedAtColumn,
});

export const ZStockExchange = createSelectSchema(StockExchanges);
export type TStockExchange = z.infer<typeof ZStockExchange>;

export const ZInsertStockExchange = createInsertSchema(StockExchanges, {
  symbol: string => string.nonempty(),
  name: string => string.nonempty(),
  description: string => string.optional(),
});
export type TInsertStockExchange = z.infer<typeof ZInsertStockExchange>;

/**
 *
 */

export const StockPositions = pgTable(Tables.STOCK_POSITIONS, {
  ...BaseColumns,
  ...OwnerColumn, // FIXME: there should be a foreign key to the user table
  exchange: varchar('exchange', {length: 11})
    .references(() => StockExchanges.symbol, {
      onDelete: 'cascade',
    })
    .notNull(),
  boughtAt: timestamp('boughtAt').notNull(),
  isin: varchar('isin', {length: 12}).notNull(),
  buyInPrice: doublePrecision('buyInPrice').notNull(),
  currency: varchar('currency', {length: 3}).notNull(),
  quantity: integer('quantity').notNull(),
  ...DescriptionColumn,
});

export const ZStockPosition = createSelectSchema(StockPositions);
export type TStockPosition = z.infer<typeof ZStockPosition>;

export const ZInsertStockPosition = createInsertSchema(StockPositions, {
  owner: owner => owner.nonempty(),
  exchange: string => string.nonempty(),
  boughtAt: date => date,
  isin: string => string.length(12, {message: 'ISIN must be 12 characters long'}),
  buyInPrice: doublePrecision => doublePrecision,
  currency: string => string.nonempty(),
  quantity: integer => integer.nonnegative(),
  description: string => string.optional(),
});
export type TInsertStockPosition = z.infer<typeof ZInsertStockPosition>;

/**
 *
 */

export const StockWatchlists = pgTable(Tables.STOCK_WATCHLISTS, {
  ...BaseColumns,
  ...OwnerColumn, // FIXME: there should be a foreign key to the user table
  exchange: varchar('exchange', {length: 11})
    .references(() => StockExchanges.symbol, {
      onDelete: 'cascade',
    })
    .notNull(),
  isin: varchar('isin', {length: 12}).notNull(),
  ...DescriptionColumn,
});

export const ZStockWatchlist = createSelectSchema(StockWatchlists);
export type TStockWatchlist = z.infer<typeof ZStockWatchlist>;

export const ZInsertStockWatchlist = createInsertSchema(StockWatchlists, {
  owner: owner => owner.nonempty(),
  exchange: string => string.nonempty(),
  isin: string => string.length(12, {message: 'ISIN must be 12 characters long'}),
  description: string => string.optional(),
});
export type TInsertStockWatchlist = z.infer<typeof ZInsertStockWatchlist>;
