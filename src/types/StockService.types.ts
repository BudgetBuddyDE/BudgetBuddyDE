import {z} from 'zod';
import {ZDate} from '@budgetbuddyde/types';

// Base

export const ZCurrency = z.string().max(3, {message: 'Currency must be 3 characters long'});
export type TCurrency = z.infer<typeof ZCurrency>;

export const ZTimeframe = z.enum(['1d', '1m', '3m', '1y', '5y', 'ytd']);
export type TTimeframe = z.infer<typeof ZTimeframe>;

// Dividends

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
  declarationDate: ZDate.nullable(),
  recordDate: ZDate.nullable(),
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

// Assets

type TStockAssetType = 'security' | 'Security' | 'crypto' | 'Crypto';

type TStockAssetId<T extends 'Security' | 'Crypto'> = {
  identifier: string;
  assetType: T;
};

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

export type TAssetSearchEntity = {
  name: string;
  score: number;
} & (
  | {
      assetType: 'security';
      assetId: TStockAssetId<'Security'>;
      asset: {
        _id: TStockAssetId<'Security'>;
        assetType: 'Security';
        logo: string;
        name: string;
        security: {
          website?: string;
          type: 'Aktie' | 'EFT' | string;
          wkn: string;
          isin: string;
          etfDomicile?: string;
          etfCompany?: string;
        };
        popularityScore?: number;
        score: number;
      };
      security: {
        wkn: string;
        isin: string;
        name: string;
        type: 'Aktie' | 'EFT' | string;
        logo: string;
        website?: string;
      };
    }
  | {
      assetType: 'crypto';
      assetId: TStockAssetId<'Crypto'>;
      asset: {
        _id: TStockAssetId<'Crypto'>;
        assetType: 'Crypto';
        logo: string;
        name: string;
        crypto: {website: string; symbol: string};
        popularityScore: number;
        score: number;
      };
      crypto: {
        symbol: string;
        name: string;
        logo: string;
        website: string;
      };
    }
);

export const ZStockType = z.enum(['Aktie', 'ETF']).or(z.string());
export type TStockType = z.infer<typeof ZStockType>;

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

export const ZAssetQuote = z.object({
  currency: ZCurrency,
  exchange: z.string(),
  date: ZDate,
  datetime: ZDate,
  price: z.number(),
  isin: z.string(),
  cachedAt: ZDate,
});
export type TAssetQuote = z.infer<typeof ZAssetQuote>;

export type TAssetWithQuote = {
  asset: {
    _id: TStockAssetId<'Security'>;
    assetType: TStockAssetType;
    logo: string;
    name: string;
    security: {
      website: string;
      type: string;
      wkn: string;
      isin: string;
      etfDomicile?: string;
      etfCompany?: string;
    };
  };
  quote: TAssetQuote;
};

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
      isin: z.string(),
      symbols: z.array(
        z.object({
          exchange: z.string(),
          symbol: z.string(),
        }),
      ),
      website: z.string().url(),
      wkn: z.string(),
      type: z.string(),
      ipoDate: ZDate,
      etfDomicile: z.string(),
      etfCompany: z.string(),
      hasDividends: z.boolean(),
    }),
  }),
  quote: ZAssetQuote,
  details: z.object({
    securityDetails: z.object({
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
      dividendYielPercentageTTM: z.number(),
      dividendPerShareTTM: z.number(),
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
    }),
    etfBreakdown: z.null(),
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
    payoutInterval: z.string(),
    payoutIntervalSource: z.string(),
    dividendKPIs: z.object({
      cagr3Y: z.number(),
      cagr5Y: z.number(),
      cagr10Y: z.number(),
      dividendYieldPercentageTTM: z.number(),
      dividendPerShareTTM: z.number(),
    }),
    dividendYearlyTTM: z.record(z.string(), z.number()),
  }),
});
export type TAssetDetails = z.infer<typeof ZAssetDetails>;
