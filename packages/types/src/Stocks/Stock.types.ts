import {z} from 'zod';
import {ZBaseModel, ZId} from '../PocketBase.types';
import {ZDate} from '../Base.type';
import {ZUser} from '../User.types';

export const ZIsin = z.string().max(12, {message: 'ISIN can only be 12 characters long'});
export type TIsin = z.infer<typeof ZIsin>;

export const ZWKN = z.string().max(6, {message: 'WKN can only be 6 characters long'});
export type TWKN = z.infer<typeof ZWKN>;

export const ZCurrency = z.string().max(3, {message: 'Currency must be 3 characters long'});
export type TCurrency = z.infer<typeof ZCurrency>;

export const ZTimeframe = z.enum(['1d', '1m', '3m', '1y', '5y', 'ytd']);
export type TTimeframe = z.infer<typeof ZTimeframe>;

export const ZStockType = z.enum(['Aktie', 'ETF', 'Optionsschein']).or(z.string());
export type TStockType = z.infer<typeof ZStockType>;

export const ZSecurity = z.object({
  website: z.string().url().optional(),
  type: ZStockType,
  wkn: ZWKN,
  isin: ZIsin,
  etfDomicile: z.string().optional(),
  etfCompany: z.string().optional(),
});

/**
 * Stock API Types
 */

export const ZStockQuote = z.object({
  currency: z.string().max(3),
  exchange: z.string().max(100),
  date: ZDate,
  datetime: ZDate,
  price: z.number(),
  isin: z.string().max(12),
  cachedAt: ZDate.optional(),
});
export type TStockQuote = z.infer<typeof ZStockQuote>;

export const ZAsset = z.object({
  _id: z.object({
    identifier: z.string(),
    assetType: z.string(),
  }),
  assetType: z.string(),
  name: z.string(),
  logo: z.string().url(),
  security: ZStockQuote,
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
    }),
  ),
  priceChart: z.array(
    z.object({
      values: z.object({
        price: z.number(),
      }),
      date: ZDate,
      mark: z.string(), // "most_recent", "eod", "bod"
    }),
  ),
  exchange: z.string(),
});
export type TAssetChartQuote = z.infer<typeof ZAssetChartQuote>;

export const ZDividend = z.object({
  type: z.string(),
  security: z.string(),
  price: z.number(),
  currency: ZCurrency,
  date: ZDate,
  datetime: ZDate,
  originalPrice: z.number().optional(),
  originalCurrency: ZCurrency.optional(),
  paymentDate: ZDate,
  declarationDate: ZDate.nullable().optional(),
  recordDate: ZDate.nullable().optional(),
  exDate: ZDate,
  isEstimated: z.boolean(),
});
export type TDividend = z.infer<typeof ZDividend>;

export const ZPayoutInterval = z.enum(['none', 'month', 'quarter', 'halfyear', 'year']);
export type TPayoutInterval = z.infer<typeof ZPayoutInterval>;

export const ZDividendDetails = z.object({
  identifier: ZIsin,
  payoutInterval: ZPayoutInterval,
  asset: z.object({
    _id: z.object({
      identifier: ZIsin,
      assetType: z.string(),
    }),
    assetType: z.string(),
    name: z.string(),
    logo: z.string().url(),
    security: ZSecurity,
  }),
  historyDividends: z.array(ZDividend).nullable().default([]),
  futureDividends: z.array(ZDividend).nullable().default([]),
  dividendKPIs: z
    .object({
      cagr3Y: z.number().nullable(),
      cagr5Y: z.number().nullable(),
      cagr10Y: z.number().nullable(),
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

export const ZAssetDetails = z.object({
  asset: z.object({
    _id: z.object({
      identifier: z.string(),
      assetType: z.string(),
    }),
    assetType: z.string(),
    name: z.string(),
    logo: z.string(),
    createdAt: ZDate,
    updatedAt: ZDate,
    security: z.object({
      regions: z.array(
        z.object({
          share: z.number(),
          id: z.string(),
        }),
      ),
      sectors: z.array(
        z.object({
          share: z.number(),
          id: z.string(),
        }),
      ),
      countries: z.array(
        z.object({
          share: z.number(),
          id: z.string(),
        }),
      ),
      industries: z.array(
        z.object({
          share: z.number(),
          id: z.string(),
        }),
      ),
      isin: ZIsin,
      symbols: z.array(
        z.object({
          exchange: z.string(),
          symbol: z.string(),
        }),
      ),
      website: z.string().url(),
      wkn: ZWKN,
      type: ZStockType,
      ipoDate: ZDate,
      etfDomicile: z.string().optional(),
      etfCompany: z.string().optional(),
      hasDividends: z.boolean().optional(),
    }),
  }),
  quote: ZStockQuote,
  details: z.object({
    securityDetails: z
      .object({
        description: z.string(),
        currency: ZCurrency,
        marketCap: z.number(),
        shares: z.number(),
        fullTimeEmployees: z.number(),
        beta: z.number(),
        peRatioTTM: z.number(),
        priceSalesRatioTTM: z.number(),
        priceToBookRatioTTM: z.number(),
        pegRatioTTM: z.number(),
        priceFairValueTTM: z.number(),
        dividendYielPercentageTTM: z.number().nullable(),
        dividendPerShareTTM: z.number().nullable(),
        payoutRatioTTM: z.number(),
        fiftyTwoWeekRange: z.object({
          from: z.number(),
          to: z.number(),
        }),
        address: z.object({
          addressLine: z.string(),
          city: z.string(),
          state: z.string(),
          zip: z.string(),
        }),
        incomeStatementGrowth: z.array(
          z.object({
            date: ZDate,
            growthRevenue: z.number(),
            growthNetIncome: z.number(),
          }),
        ),
        annualFinancials: z.array(
          z.object({
            currency: ZCurrency,
            date: ZDate,
            revenue: z.number(),
            grossProfit: z.number(),
            netIncome: z.number(),
            ebitda: z.number(),
          }),
        ),
        quarterlyFinancials: z.array(
          z.object({
            currency: ZCurrency,
            date: ZDate,
            revenue: z.number(),
            grossProfit: z.number(),
            netIncome: z.number(),
            ebitda: z.number(),
          }),
        ),
        ceo: z.string(),
      })
      .optional(),
    eftDetails: z
      .object({
        currency: ZCurrency,
        nav: z.number(),
        description: z.string(),
        priceToBook: z.number(),
        priceToEarnings: z.number(),
        aum: z.number(),
        expenseRatio: z.number(),
      })
      .optional(),
    etfBreakdown: z
      .object({
        currency: ZCurrency,
        updatedAt: ZDate,
        holdings: z.array(
          z.object({
            share: z.number(),
            marketValue: z.number(),
            amountOfShares: z.number(),
            name: z.string(),
            asset: z.object({
              _id: z.object({
                identifier: z.string(),
                assetType: z.string(),
              }),
              assetType: z.string(),
              name: z.string(),
              logo: z.string(),
              security: ZSecurity,
            }),
          }),
        ),
      })
      .nullable()
      .optional(),
    analystEstimates: z
      .object({
        strongBuy: z.number(),
        buy: z.number(),
        hold: z.number(),
        sell: z.number(),
        strongSell: z.number(),
      })
      .nullable(),
    historicalDividends: z.array(ZDividend).nullable().default([]),
    futureDividends: z.array(ZDividend).nullable().default([]),
    priceTargetConsensus: z
      .object({
        currency: ZCurrency,
        high: z.number(),
        low: z.number(),
        consensus: z.number(),
        median: z.number(),
      })
      .nullable(),
    analysis: z.object({
      entries: z.array(
        z.object({
          analysisDate: ZDate,
          mediaType: z.string(), // video, article
          ratingCount: z.number(),
          rating: z.number(),
          author: z.string(),
          title: z.string(),
          url: z.string().url(),
        }),
      ),
    }),
    news: z.array(
      z.object({
        publishedAt: ZDate,
        title: z.string(),
        description: z.string(),
        image: z.string().url(),
        url: z.string().url(),
      }),
    ),
    scorings: z.array(
      z.object({
        source: z.string(),
        type: z.string(),
        value: z.number(),
        maxValue: z.number(),
        badgeColor: z.string(), // hex color
      }),
    ),
    payoutInterval: z.string().nullable(),
    payoutIntervalSource: z.string().nullable(),
    dividendKPIs: z
      .object({
        cagr3Y: z.number().nullable(),
        cagr5Y: z.number().nullable(),
        cagr10Y: z.number().nullable(),
        dividendYieldPercentageTTM: z.number(),
        dividendPerShareTTM: z.number(),
      })
      .nullable()
      .optional(),
    dividendYearlyTTM: z.record(z.string(), z.number()).nullable(),
  }),
});
export type TAssetDetails = z.infer<typeof ZAssetDetails>;

/**
 * Pocketbase Table Types
 */

export const ZStockExchange = z.object({
  ...ZBaseModel.shape,
  ...z.object({
    name: z.string(),
    symbol: z.string(),
    exchange: z.string(),
  }).shape,
});
export type TStockExchange = z.infer<typeof ZStockExchange>;

export const ZStockPosition = z.object({
  ...ZBaseModel.shape,
  ...z.object({
    owner: ZId,
    exchange: ZId,
    bought_at: ZDate,
    isin: z.string(),
    buy_in: z.number(),
    currency: ZCurrency,
    quantity: z.number(),
    expand: z.object({
      exchange: ZStockExchange,
    }),
  }).shape,
});
export type TStockPosition = z.infer<typeof ZStockPosition>;

export const ZStockPositionWithQuote = z.object({
  ...ZBaseModel.shape,
  ...z.object({
    owner: ZId,
    exchange: ZId,
    bought_at: ZDate,
    isin: ZIsin,
    buy_in: z.number(),
    currency: ZCurrency,
    quantity: z.number(),
    expand: z.object({
      exchange: ZStockExchange,
    }),
    name: z.string(),
    logo: z.string().url(),
    wkn: ZWKN,
    volume: z.number(),
    quote: ZStockQuote,
  }).shape,
});
export type TStockPositionWithQuote = z.infer<typeof ZStockPositionWithQuote>;

export const ZCreateStockPositionPayload = z.object({
  owner: ZId,
  exchange: ZId,
  bought_at: ZDate,
  isin: ZIsin,
  buy_in: z.number(),
  currency: ZCurrency,
  quantity: z.number(),
});
export type TCreateStockPositionPayload = z.infer<typeof ZCreateStockPositionPayload>;

export const ZUpdateStockPositionPayload = z.object({
  id: ZId,
  owner: ZId,
  exchange: ZId,
  bought_at: ZDate,
  isin: ZIsin,
  buy_in: z.number(),
  currency: ZCurrency,
  quantity: z.number(),
});
export type TUpdateStockPositionPayload = z.infer<typeof ZUpdateStockPositionPayload>;

export const ZRelatedStock = z.object({
  asset: z.object({
    _id: z.object({
      identifier: ZIsin,
      assetType: z.string(),
    }),
    assetType: z.string(),
    name: z.string(),
    logo: z.string().url(),
    security: ZSecurity.optional(),
  }),
});
export type TRelatedStock = z.infer<typeof ZRelatedStock>;

export const ZRelatedStockWithQuotes = z.object({
  ...ZRelatedStock.shape,
  quotes: z.array(
    z.object({
      date: ZDate,
      price: z.number(),
      exchange: z.string(),
      currency: ZCurrency,
    }),
  ),
});
export type TRelatedStockWithQuotes = z.infer<typeof ZRelatedStockWithQuotes>;

export const ZAssetWatchlist = z.object({
  ...ZBaseModel.shape,
  ...z.object({
    owner: ZId,
    exchange: ZId,
    isin: ZIsin,
  }).shape,
});
export type TAssetWatchlist = z.infer<typeof ZAssetWatchlist>;

export const ZAssetWatchlistWithQuote = z.object({
  ...ZBaseModel.shape,
  ...z.object({
    owner: ZId,
    exchange: ZId,
    isin: ZIsin,
    name: z.string(),
    logo: z.string().url(),
    wkn: ZWKN,
    expand: z.object({
      owner: ZUser,
      exchange: ZStockExchange,
    }),
    quote: ZStockQuote,
  }).shape,
});
export type TAssetWatchlistWithQuote = z.infer<typeof ZAssetWatchlistWithQuote>;

export const ZAddWatchlistAssetPayload = z.object({
  owner: ZId,
  isin: ZIsin,
  exchange: ZId,
});
export type TAddWatchlistAssetPayload = z.infer<typeof ZAddWatchlistAssetPayload>;

export const ZDeleteWatchlistAssetPayload = z.object({id: ZId});
export type TDeleteWatchlistAssetPayload = z.infer<typeof ZDeleteWatchlistAssetPayload>;
