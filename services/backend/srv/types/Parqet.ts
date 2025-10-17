import { z } from "zod";

export const ZodDate = z
  .date()
  .or(z.number())
  .or(z.string())
  .transform((val) => new Date(val));
export const ISIN = z
  .string()
  .max(12, { message: "ISIN can only be 12 characters long" });
export const WKN = z
  .string()
  .max(6, { message: "WKN can only be 6 characters long" });
export const CurrencyCode = z.string().toUpperCase().length(3);
export const CountryCode = z.string().toUpperCase();
export const AssetType = z.enum(["Security", "Commodity", "Crypto"]);
// REVISIT: Rename this
export const AssetSecurityCategorySplit = z.object({
  share: z.number().min(0).max(100),
  id: z.string(),
});
export const SecuritySymbol = z.object({
  exchange: z.string(),
  symbol: z.string(),
});
export const SecurityType = z.enum(["Aktie", "ETF", "Zertifikat"]);

export const DividendPayoutInterval = z.enum([
  "year",
  "halfyear",
  "quarter",
  "month",
  "none",
]);
export const Dividend = z.object({
  type: z.enum(["Dividend"]),
  security: ISIN,
  price: z.number().min(0),
  currency: z.string().length(3),
  date: ZodDate,
  datetime: ZodDate,
  paymentDate: ZodDate,
  declarationDate: ZodDate.optional(),
  recordDate: ZodDate.or(z.string()).optional(),
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
  mediaType: z.enum(["video", "article"]).or(z.string()),
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
    payoutInterval: DividendPayoutInterval.or(z.string()),
    payoutIntervalSource: z.enum(["divvy_diary"]).or(z.string()).nullable(),
    dividendKPIs: DividendKPI.optional(),
    dividendYearlyTTM: z
      .record(z.string().length(4), z.number().nullable())
      .nullable(),
  }),
});

const SecurityAssetId = z.object({
  identifier: ISIN,
  assetType: AssetType,
});

export const SearchResultItem = z.discriminatedUnion("assetType", [
  z.looseObject({
    name: z.string(),
    assetType: z.literal("Security"),
    assetId: SecurityAssetId,
    asset: z.object({
      _id: SecurityAssetId,
      assetType: z.literal("Security"),
      name: z.string(),
      logo: z.url(),
      security: z.object({
        type: SecurityType.or(z.string()),
        wkn: WKN.or(z.string()),
        isin: ISIN.or(z.string()),
        name: z.string().optional(),
        logo: z.url().optional(),
        website: z.url().or(z.string()).optional(),
        etfDomicile: CountryCode.optional(),
        etfCompany: z.string().optional(),
      }),
      popularityScore: z.number().optional(),
      score: z.number(),
    }),
    score: z.number(),
    security: z.object({
      type: SecurityType.or(z.string()),
      wkn: WKN.or(z.string()),
      isin: ISIN.or(z.string()),
      name: z.string().or(z.string()).optional(),
      logo: z.url(),
      website: z.url().or(z.string()).optional(),
    }),
  }),
  z.looseObject({
    name: z.string(),
    assetType: z.literal("Commodity"),
    assetId: z.object({
      identifier: z.string(),
      assetType: z.literal("Commodity"),
    }),
    asset: z.object({
      _id: z.object({
        identifier: z.string(),
        assetType: z.literal("Commodity"),
      }),
      assetType: z.literal("Commodity"),
      name: z.string(),
      logo: z.url(),
      popularityScore: z.number(),
      score: z.number(),
    }),
    score: z.number(),
  }),
  z.looseObject({
    name: z.string(),
    assetType: z.literal("Crypto"),
    assetId: z.object({
      identifier: z.string(),
      assetType: z.literal("Crypto"),
    }),
    asset: z.looseObject({
      _id: z.object({ identifier: z.string(), assetType: z.literal("Crypto") }),
      assetType: z.literal("Crypto"),
      name: z.string(),
      logo: z.url(),
      crypto: z.object({ website: z.url(), symbol: z.string() }),
      score: z.number(),
    }),
    score: z.number(),
    crypto: z.looseObject({
      symbol: z.string(),
      name: z.string(),
      logo: z.url(),
      website: z.url(),
    }),
  }),
]);

export const SearchResponse = z.object({
  fallbackResults: z.boolean(),
  results: z.array(SearchResultItem),
});

export const AssetQuote = z.object({
  assetId: z.object({
    identifier: ISIN,
    assetType: AssetType,
  }),
  assetIdentifier: ISIN,
  interval: z.object({
    from: ZodDate,
    to: ZodDate,
    timeframe: z.string(),
  }),
  from: ZodDate,
  currency: CurrencyCode,
  quotes: z.array(
    z.object({
      date: ZodDate,
      price: z.number(),
    }),
  ),
  priceChart: z.array(
    z.object({
      values: z.object({ price: z.number() }),
      date: ZodDate,
      mark: z.enum(["bod", "eod", "most_recent", "mark"]),
    }),
  ),
  exchange: z.string().optional(), // FIXME: Use actual technical type for stock-exchanges
});

export const DividendDetails = z.object({
  dividendDetails: z.record(
    ISIN,
    z.object({
      identifier: ISIN,
      payoutInterval: DividendPayoutInterval,
      futureDividends: z.array(Dividend).nullable(),
      historicalDividends: z.array(Dividend).nullable(),
      asset: z.null(),
      dividendKPIs: DividendKPI,
    }),
  ),
});

export const RelatedAsset = z.object({
  asset: z.discriminatedUnion("assetType", [
    z.object({
      _id: z.object({ identifier: ISIN, assetType: z.literal("Security") }),
      assetType: z.literal("Security"),
      name: z.string(),
      logo: z.url(),
      security: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("Aktie"),
          website: z.url(),
          wkn: WKN,
          isin: ISIN,
          sectors: z.array(AssetSecurityCategorySplit),
        }),
        z.object({
          type: z.literal("ETF"),
          website: z.url(),
          factsheet: z.url().optional(),
          wkn: WKN,
          isin: ISIN,
          etfDomicile: CountryCode,
          etfCompany: z.string(),
          sectors: z.array(AssetSecurityCategorySplit),
        }),
        z.object({
          type: z.literal("Zertifikat"),
          website: z.url(),
          wkn: WKN.or(z.string()),
          isin: ISIN,
          sectors: z.array(AssetSecurityCategorySplit),
        }),
      ]),
    }),
    z.object({
      _id: z.object({ identifier: z.string(), assetType: z.literal("Crypto") }),
      assetType: z.literal("Crypto"),
      name: z.string(),
      logo: z.url(),
      crypto: z.object({ website: z.url(), symbol: z.string() }),
    }),
  ]),
});

export const Sector = z.object({
  _id: z.string(),
  labelEN: z.string(),
  labelDE: z.string(),
});
