import { z } from 'zod';
import { ZCreatedAt, ZDate } from '@budgetbuddyde/types';

// Base

export const ZCurrency = z.string().max(3, { message: 'Currency must be 3 characters long' });
export type TCurrency = z.infer<typeof ZCurrency>;

export const ZTimeframe = z.enum(['1d', '1m', '3m', '1y', '5y', 'ytd']);
export type TTimeframe = z.infer<typeof ZTimeframe>;

export const ZStockType = z.enum(['Aktie', 'ETF']).or(z.string());
export type TStockType = z.infer<typeof ZStockType>;

// Exchanges

export const ZStockExchanges = z.record(
  z.string(),
  z.object({ label: z.string(), ticker: z.string() })
);
export type TStockExchanges = z.infer<typeof ZStockExchanges>;

// Assets

export const ZAsset = z.object({
  _id: z.object({
    identifier: z.string(),
    assetType: z.string(),
  }),
  assetType: z.string(),
  name: z.string(),
  logo: z.string().url(),
  security: z.object({
    website: z.string().url(),
    type: z.string(),
    wkn: z.string(),
    isin: z.string(),
    etfDomicile: z.string(),
    etfCompany: z.string(),
  }),
});
export type TAsset = z.infer<typeof ZAsset>;

export const ZAssetSearchResult = z.object({
  type: ZStockType,
  name: z.string(),
  identifier: z.string(),
  logo: z.string(),
  domicile: z.string().optional(),
  wkn: z.string(),
  website: z.string().optional(),
});
export type TAssetSearchResult = z.infer<typeof ZAssetSearchResult>;

export const ZAssetChartQuote = z.object({
  assetId: z.object({
    identifier: z.string(),
    assetType: z.string(),
  }),
  assetIdentifier: z.string(),
  interval: z.object({
    from: ZDate,
    to: ZDate,
    timeframe: z.string(),
  }),
  from: ZDate,
  currency: ZCurrency,
  quotes: z.array(
    z.object({
      date: ZDate,
      price: z.number(),
    })
  ),
  priceChart: z.array(
    z.object({
      values: z.object({
        price: z.number(),
      }),
      date: ZDate,
      mark: z.string(), // "most_recent", "eod", "bod"
    })
  ),
  exchange: z.string(),
});
export type TAssetChartQuote = z.infer<typeof ZAssetChartQuote>;

// Dividends

export const ZDividend = z.object({
  type: z.string(),
  security: z.string(),
  price: z.number(),
  currency: ZCurrency,
  date: ZDate,
  datetime: ZDate,
  originalPrice: z.number(),
  originalCurrency: ZCurrency,
  paymentDate: ZDate,
  declarationDate: ZDate,
  recordDate: ZDate,
  exDate: ZDate,
  isEstimated: z.boolean(),
});
export type TDividend = z.infer<typeof ZDividend>;

export const ZDividendDetails = z.object({
  identifier: z.string(),
  payoutInterval: z.string(),
  asset: z
    .object({
      _id: z.object({
        identifier: z.string(),
        assetType: z.string(),
      }),
      assetType: z.string(),
      name: z.string(),
      logo: z.string(),
      security: z.object({
        website: z.string(),
        type: z.string(),
        wkn: z.string(),
        isin: z.string(),
        etfDomicile: z.string().optional(),
        etfCompany: z.string().optional(),
      }),
    })
    .nullable()
    .default(null),
  historyDividends: z.array(ZDividend).nullable().default([]),
  futureDividends: z.array(ZDividend).nullable().default([]),
  dividendKPIs: z
    .object({
      cagr3Y: z.number(),
      cagr5Y: z.number(),
      cagr10Y: z.number(),
      dividendYieldPercentageTTM: z.number(),
      dividendPerShareTTM: z.number(),
    })
    .optional(),
});
export type TDividendDetails = z.infer<typeof ZDividendDetails>;
export const ZDividendDetailList = z.object({
  dividendDetails: z.record(z.string(), ZDividendDetails),
});
export type TDividendDetailList = z.infer<typeof ZDividendDetailList>;

// SORT
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
    name: z.string().max(100),
    exchange: z.string().max(100),
    country: z.string().max(100),
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
