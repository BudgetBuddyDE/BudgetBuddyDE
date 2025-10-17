import { z } from 'zod';

export const ISIN = z.string().min(12).max(12);
export const ZodDate = z
  .date()
  .or(z.number())
  .or(z.string())
  .transform((val) => new Date(val));
export const WKN = z.string().length(6);
export const CurrencyCode = z.string().toUpperCase().length(3);
export const AssetType = z.enum(['Security', 'Commodity', 'Crypto']); // REVISIT: Rename this
export const AssetSecurityCategorySplit = z.object({
  share: z.number().min(0).max(100),
  id: z.string(),
});
export const SecuritySymbol = z.object({ exchange: z.string(), symbol: z.string() });
export const SecurityType = z.enum(['Aktie', 'ETF', 'Zertifikat']);

export const Dividend = z.object({
  type: z.enum(['Dividend']),
  security: ISIN,
  price: z.number().min(0),
  currency: z.string().length(3),
  date: ZodDate,
  datetime: ZodDate,
  paymentDate: ZodDate,
  declarationDate: ZodDate.optional(),
  recordDate: ZodDate.or(z.string()).nullable().optional(),
  exDate: ZodDate,
  isEstimated: z.boolean(),
});

export const Quote = z.object({
  currency: CurrencyCode,
  exchange: z.string(),
  date: ZodDate,
  datetime: ZodDate,
  price: z.number().min(0),
  isin: ISIN,
  cachedAt: ZodDate,
});

export const IncomeStatementGrowth = z.object({
  date: ZodDate,
  growthRevenue: z.number(),
  growthNetIncome: z.number(),
});

export const FinancialResult = z.object({
  currency: CurrencyCode,
  date: ZodDate,
  revenue: z.number(),
  grossProfit: z.number(),
  netIncome: z.number(),
  ebitda: z.number(),
});

export const AnalystEstimates = z.object({
  strongBuy: z.number().min(0),
  buy: z.number().min(0),
  hold: z.number().min(0),
  sell: z.number().min(0),
  strongSell: z.number().min(0),
});

export const SecurityAnalysis = z.object({
  analysisDate: ZodDate,
  mediaType: z.enum(['video', 'article']).or(z.string()),
  ratingCount: z.number().min(0),
  rating: z.number().min(0),
  author: z.string(),
  title: z.string(),
  url: z.url(),
});

export const PriceTargetConsensus = z.object({
  currency: CurrencyCode,
  high: z.number(),
  low: z.number(),
  consensus: z.number(),
  median: z.number(),
});

export const News = z.object({
  publishedAt: ZodDate,
  title: z.string(),
  description: z.string(),
  image: z.url().optional(),
  url: z.url(),
});

export const SecurityScoring = z.object({
  source: z.string(),
  type: z.string(),
  value: z.number(),
  maxValue: z.number(),
  badgeColor: z.string().regex(/^#[0-9A-F]{6}$/i), // hex color
});

export const DividendKPI = z.object({
  cagr3Y: z.number().nullable(),
  cagr5Y: z.number().nullable(),
  cagr10Y: z.number().nullable(),
  dividendYieldPercentageTTM: z.number().optional(),
  dividendPerShareTTM: z.number(),
});

export const Asset = z.object({
  asset: z.object({
    _id: z.object({
      identifier: ISIN,
      assetType: AssetType,
    }),
    assetType: AssetType,
    name: z.string(),
    logo: z.url(),
    createdAt: ZodDate,
    updatedAt: ZodDate,
    security: z.looseObject({
      regions: z.array(AssetSecurityCategorySplit),
      sectors: z.array(AssetSecurityCategorySplit),
      countries: z.array(AssetSecurityCategorySplit),
      industries: z.array(AssetSecurityCategorySplit),
      isin: ISIN,
      symbols: z.array(SecuritySymbol),
      website: z.url(),
      wkn: WKN,
      type: SecurityType,
      ipoDate: ZodDate,
      hasDividends: z.boolean(),
    }),
  }),
  quote: Quote,
  details: z.looseObject({
    description: z.string(),
    securityDetails: z.looseObject({
      description: z.string(),
      currency: CurrencyCode,
      marketCap: z.number(),
      shares: z.number(),
      fullTimeEmployees: z.number(),
      beta: z.number(),
      peRatioTTM: z.number(),
      priceSalesRatioTTM: z.number(),
      priceToBookRatioTTM: z.number(),
      pegRatioTTM: z.number(),
      priceFairValueTTM: z.number(),
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
        zip: z.string().or(z.number()),
      }),
      incomeStatementGrowth: z.array(IncomeStatementGrowth),
      annualFinancials: z.array(FinancialResult),
      quarterlyFinancials: z.array(FinancialResult),
      ceo: z.string(),
    }),
    etfBreakdown: z.object().nullable(),
    analystEstimates: AnalystEstimates,
    historicalDividends: z.array(Dividend),
    futureDividends: z.array(Dividend),
    priceTargetConsensus: PriceTargetConsensus.nullable(),
    analysis: z
      .object({
        entries: z.array(SecurityAnalysis),
      })
      .optional(),
    news: z.array(News),
    partnerNews: z.array(News),
    scoring: z.array(SecurityScoring).optional(),
    payoutInterval: z.enum(['year']).or(z.string()),
    payoutIntervalSource: z.enum(['divvy_diary']).or(z.string()),
    dividendKPIs: DividendKPI,
    dividendYearlyTTM: z.record(z.string().length(4), z.number().nullable()),
  }),
});
