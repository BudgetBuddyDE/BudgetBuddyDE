import {z} from 'zod';
import {ZCreatedAt, ZDate} from '@budgetbuddyde/types';

export type TStockType = 'Aktie' | 'ETF' | string;

export type TSearchEntity = {
  type: TStockType;
  name: string;
  identifier: string;
  logo: string;
};

export type TStock = {
  type: TStockType;
  name: string;
  isin: string;
  wkn?: string;
  logo: string;
  website?: string;
};

export const ZStockQuote = z.object({
  currency: z.string().length(3),
  exchange: z.string().max(100),
  date: ZDate,
  datetime: ZDate,
  price: z.number(),
  isin: z.string().length(12),
  cachedAt: ZDate,
});
export type TStockQuote = z.infer<typeof ZStockQuote>;

/**
 * Represents a stock exchange table.
 */
export const ZStockExchangeTable = z.object({
  symbol: z.string().length(5),
  name: z.string().length(100),
  exchange: z.string().length(100),
  country: z.string().length(100),
  created_at: ZCreatedAt,
});
/**
 * Represents the type of the stock exchange table.
 */
export type TStockExchangeTable = z.infer<typeof ZStockExchangeTable>;

/**
 * Represents a stock position table.
 *
 * @remarks
 * This type defines the structure of a stock position table, including properties such as id, owner, bought_at, exchange, isin, buy_in, and currency.
 */
export const ZStockPositionTable = z.object({
  id: z.number(),
  owner: z.string().uuid(),
  bought_at: ZDate,
  exchange: z.string(),
  isin: z.string().length(12),
  buy_in: z.number(),
  currency: z.string().length(3),
  quantity: z.number(),
  created_at: ZCreatedAt,
});
/**
 * Represents the type of the stock position table.
 */
export type TStockPositionTable = z.infer<typeof ZStockPositionTable>;

/**
 * Represents a stock position table with resolved joins.
 */
export const ZMaterializedStockPositionTable = z.object({
  id: z.number(),
  owner: z.string(),
  bought_at: ZDate,
  exchange: z.object({
    symbol: z.string().length(5),
    name: z.string().length(100),
    exchange: z.string().length(100),
    country: z.string().length(100),
  }),
  isin: z.string().length(12),
  buy_in: z.number(),
  currency: z.string().length(3),
  quantity: z.number(),
  created_at: ZCreatedAt,
});
/**
 * Represents the type of a stock position table with resolved join.
 */
export type TMaterializedStockPositionTable = z.infer<typeof ZMaterializedStockPositionTable>;

/**
 * Represents the payload for opening a position.
 */
export const ZOpenPositionPayload = z.object({
  owner: z.string().uuid(),
  bought_at: ZDate,
  exchange: z.string(),
  isin: z.string().length(12),
  buy_in: z.number(),
  currency: z.string().length(3),
  quantity: z.number(),
});
/**
 * Represents the type of the payload for opening a position.
 */
export type TOpenPositionPayload = z.infer<typeof ZOpenPositionPayload>;

/**
 * Represents the payload for updating a position.
 */
export const ZUpdatePositionPayload = z.object({
  id: z.number(),
  bought_at: ZDate,
  exchange: z.string(),
  isin: z.string().length(12),
  buy_in: z.number(),
  quantity: z.number(),
});
/**
 * Represents the payload for updating a position.
 */
export type TUpdatePositionPayload = z.infer<typeof ZUpdatePositionPayload>;

/**
 * Represents the payload for closing a position.
 */
export const ZClosePositionPayload = z.object({
  id: z.number(),
});
/**
 * Represents the payload for closing a position.
 */
export type TClosePositionPayload = z.infer<typeof ZClosePositionPayload>;

export const ZStockPosition = z.union([
  ZMaterializedStockPositionTable,
  z.object({
    name: z.string(),
    logo: z.string(),
    quote: ZStockQuote,
    volume: z.number(),
  }),
]);
export type TStockPosition = z.infer<typeof ZStockPosition>;
