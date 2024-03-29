import {z} from 'zod';
import {ZCreatedAt, ZCurrency, ZDate} from '@budgetbuddyde/types';

/**
 * Represents a collection of stock exchanges.
 * The keys are exchange names (used by the API), and the values are objects containing the exchange label and ticker symbol.
 */
export const ZStockExchanges = z.record(z.string(), z.object({label: z.string(), ticker: z.string()}));
export type TStockExchanges = z.infer<typeof ZStockExchanges>;

export const ZStockQuote = z.object({
  currency: z.string().max(3),
  exchange: z.string().max(100),
  date: ZDate,
  datetime: ZDate,
  price: z.number(),
  isin: z.string().max(12),
  cachedAt: ZDate,
});
export type TStockQuote = z.infer<typeof ZStockQuote>;

/**
 * Represents a stock exchange table.
 */
export const ZStockExchangeTable = z.object({
  symbol: z.string().max(5),
  name: z.string().max(100),
  exchange: z.string().max(100),
  country: z.string().max(100),
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
  isin: z.string().max(12),
  buy_in: z.number(),
  currency: z.string().max(3),
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
    symbol: z.string().max(5),
    name: z.string().length(100),
    exchange: z.string().length(100),
    country: z.string().length(100),
  }),
  isin: z.string().max(12),
  buy_in: z.number(),
  currency: z.string().max(3),
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
  isin: z.string().max(12),
  buy_in: z.number(),
  currency: z.string().max(3),
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
  isin: z.string().max(12),
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

export const ZStockPosition = z.object({
  id: z.number(),
  owner: z.string().uuid(),
  bought_at: ZDate,
  exchange: z.object({
    symbol: z.string(),
    name: z.string(),
    exchange: z.string(),
    country: z.string(),
  }),
  isin: z.string(),
  buy_in: z.number(),
  currency: ZCurrency,
  quantity: z.number(),
  created_at: ZDate,
  name: z.string(),
  logo: z.string(),
  volume: z.number(),
  quote: z.object({
    currency: ZCurrency,
    exchange: z.string(),
    date: ZDate,
    datetime: ZDate,
    price: z.number(),
    isin: z.string(),
    cachedAt: ZDate,
  }),
});
export type TStockPosition = z.infer<typeof ZStockPosition>;
