import {z} from 'zod';
import {ZDate} from '@budgetbuddyde/types';

// Base

export const ZCurrency = z.string().max(3, {message: 'Currency must be 3 characters long'});
export type TCurrency = z.infer<typeof ZCurrency>;

export const ZTimeframe = z.enum(['1d', '1m', '3m', '1y', '5y', 'ytd']);
export type TTimeframe = z.infer<typeof ZTimeframe>;

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

export type TAssetQuote = {
  currency: string;
  exchange: string;
  date: string | Date;
  datetime: string | Date;
  price: number;
  isin: string;
  cachedAt: string | Date;
};

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
