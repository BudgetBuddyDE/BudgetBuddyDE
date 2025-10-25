import {z} from 'zod';
import {common} from '../common';
import {AssetIdentifier, AssetType, CryptoSymbol, ISIN, SecurityType, WKN} from './base';

const DividendPayoutInterval = z.enum(['year', 'halfyear', 'quarter', 'month', 'none']);
const Dividend = z.object({
  type: z.literal('Dividend'),
  security: ISIN,
  price: z.number().min(0),
  currency: z.string().length(3),
  date: common.ZodDate,
  datetime: common.ZodDate,
  paymentDate: common.ZodDate,
  declarationDate: common.ZodDate.optional(),
  recordDate: common.ZodDate.or(z.string()).optional(),
  exDate: common.ZodDate,
  isEstimated: z.boolean(),
});

const AssetSecurityCategorySplit = z.object({
  share: z.number().min(0).max(100),
  id: z.string(),
});

const SecuritySymbol = z.object({
  exchange: z.string(),
  symbol: z.string(),
});

const Quote = z.object({
  currency: common.CurrencyCode,
  exchange: z.string(),
  date: common.ZodDate,
  datetime: common.ZodDate,
  price: z.number().min(0),
  originalCurrency: common.CurrencyCode.optional(),
  isin: AssetIdentifier,
  cachedAt: common.ZodDate,
  fxRate: z.number().optional(),
});

const IncomeStatementGrowth = z.object({
  date: common.ZodDate,
  growthRevenue: z.number(),
  growthNetIncome: z.number(),
});

const FinancialResult = z.object({
  currency: common.CurrencyCode,
  date: common.ZodDate,
  revenue: z.number(),
  grossProfit: z.number(),
  netIncome: z.number(),
  ebitda: z.number(),
});

const AnalystEstimates = z.object({
  strongBuy: z.number().min(0),
  buy: z.number().min(0),
  hold: z.number().min(0),
  sell: z.number().min(0),
  strongSell: z.number().min(0),
});

const SecurityAnalysis = z.object({
  analysisDate: common.ZodDate,
  mediaType: z.enum(['video', 'article']).or(z.string()),
  ratingCount: z.number().min(0),
  rating: z.number().min(0),
  author: z.string(),
  title: z.string(),
  url: z.url(),
});

const PriceTargetConsensus = z.object({
  currency: common.CurrencyCode,
  high: z.number(),
  low: z.number(),
  consensus: z.number(),
  median: z.number(),
});

const News = z.object({
  publishedAt: common.ZodDate,
  title: z.string(),
  description: z.string(),
  image: z.url().optional(),
  url: z.url(),
});

const PartnerNews = z.object({
  title: z.string(),
  url: z.url(),
  source: z.object({
    partner: z.string().lowercase(),
    title: z.string(),
    image: z.url(),
  }),
  publishedAt: common.ZodDate,
});

const SecurityScoring = z.object({
  source: z.string(),
  type: z.string(),
  value: z.number(),
  maxValue: z.number(),
  badgeColor: z.string().regex(/^#[0-9A-F]{6}$/i), // hex color
});

const DividendKPI = z.object({
  cagr3Y: z.number().nullable(),
  cagr5Y: z.number().nullable(),
  cagr10Y: z.number().nullable(),
  dividendYieldPercentageTTM: z.number().optional(),
  dividendPerShareTTM: z.number(),
});

const BaseAsset = z.object({
  _id: z.object({
    identifier: AssetIdentifier,
    assetType: AssetType,
  }),
  assetType: AssetType,
  name: z.string(),
  logo: z.url(),
  createdAt: common.ZodDate,
  updatedAt: common.ZodDate,
});

const Asset = z.object({
  asset: z.discriminatedUnion('assetType', [
    z
      .looseObject({
        assetType: z.literal('Security'),
        security: z.discriminatedUnion('type', [
          z.looseObject({
            type: z.literal('Aktie'),
            regions: z.array(AssetSecurityCategorySplit),
            sectors: z.array(AssetSecurityCategorySplit),
            countries: z.array(AssetSecurityCategorySplit),
            industries: z.array(AssetSecurityCategorySplit),
            isin: ISIN,
            symbols: z.array(SecuritySymbol),
            website: z.url(),
            wkn: WKN,
            ipoDate: common.ZodDate,
            hasDividends: z.boolean(),
            etfDomicile: common.CountryCode.optional(),
            etfCompany: z.string().optional(),
          }),
          z.looseObject({
            type: z.literal('ETF'),
            regions: z.array(AssetSecurityCategorySplit),
            sectors: z.array(AssetSecurityCategorySplit),
            countries: z.array(AssetSecurityCategorySplit),
            industries: z.array(AssetSecurityCategorySplit),
            isin: ISIN,
            symbols: z.array(SecuritySymbol),
            website: z.url(),
            wkn: WKN,
            ipoDate: common.ZodDate,
            hasDividends: z.boolean().optional(),
            etfDomicile: common.CountryCode.optional(),
            etfCompany: z.string().optional(),
          }),
          z.looseObject({
            type: z.literal('Zertifikat'),
            regions: z.array(AssetSecurityCategorySplit),
            sectors: z.array(AssetSecurityCategorySplit),
            countries: z.array(AssetSecurityCategorySplit),
            industries: z.array(AssetSecurityCategorySplit),
            isin: ISIN,
            wkn: WKN,
          }),
        ]),
      })
      .extend(BaseAsset.omit({assetType: true}).shape),
    z
      .looseObject({
        assetType: z.literal('Commodity'),
      })
      .extend(BaseAsset.omit({assetType: true}).shape),
    z
      .looseObject({
        assetType: z.literal('Crypto'),
        crypto: z.object({
          symbol: CryptoSymbol,
          website: z.url().or(z.string()),
          technicalDocumentation: z.array(z.url()),
          sourceCode: z.array(z.url()),
        }),
      })
      .extend(BaseAsset.omit({assetType: true}).shape),
  ]),
  quote: Quote.nullable(),
  details: z.looseObject({
    description: z.string().optional(),
    etfDetails: z
      .object({
        currency: common.CurrencyCode,
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
        currency: common.CurrencyCode,
        updatedAt: common.ZodDate,
        holdings: z.array(
          z.object({
            share: z.number(),
            marketValue: z.number(),
            amountOfShares: z.number(),
            name: z.string(),
          }),
        ),
      })
      .nullable(),
    securityDetails: z
      .looseObject({
        description: z.string(),
        currency: common.CurrencyCode,
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
        incomeStatementGrowth: z.array(IncomeStatementGrowth),
        annualFinancials: z.array(FinancialResult),
        quarterlyFinancials: z.array(FinancialResult),
        ceo: z.string(),
      })
      .optional(),
    analystEstimates: AnalystEstimates.or(z.null()).transform(
      val =>
        val ?? {
          strongBuy: 0,
          buy: 0,
          hold: 0,
          sell: 0,
          strongSell: 0,
        },
    ),
    historicalDividends: z.array(Dividend).optional(),
    futureDividends: z.array(Dividend).optional(),
    priceTargetConsensus: PriceTargetConsensus.nullable(),
    analysis: z
      .object({
        entries: z.array(
          z.object({
            analysisDate: common.ZodDate,
            mediaType: z.enum(['video', 'article']).or(z.string()),
            ratingCount: z.number(),
            rating: z.number(),
            author: z.string(),
            title: z.string(),
            url: z.url(),
          }),
        ),
      })
      .nullable()
      .optional(),
    news: z.array(News),
    partnerNews: z.array(PartnerNews),
    scorings: z.array(SecurityScoring).optional(),
    payoutInterval: DividendPayoutInterval.or(z.string()).optional(),
    payoutIntervalSource: z.enum(['divvy_diary']).or(z.string()).nullable(),
    dividendKPIs: DividendKPI.optional(),
    dividendYearlyTTM: z.record(z.string().length(4), z.number().nullable()).nullable(),
  }),
});

const SecurityAssetId = z.object({
  identifier: ISIN,
  assetType: AssetType,
});

const SearchResultItem = z.discriminatedUnion('assetType', [
  z.looseObject({
    name: z.string(),
    assetType: z.literal('Security'),
    assetId: SecurityAssetId,
    asset: z.object({
      _id: SecurityAssetId,
      assetType: z.literal('Security'),
      name: z.string(),
      logo: z.url(),
      security: z.object({
        type: SecurityType.or(z.string()),
        wkn: WKN.or(z.string()),
        isin: ISIN.or(z.string()),
        name: z.string().optional(),
        logo: z.url().optional(),
        website: z.url().or(z.string()).optional(),
        etfDomicile: common.CountryCode.optional(),
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
    assetType: z.literal('Commodity'),
    assetId: z.object({
      identifier: z.string(),
      assetType: z.literal('Commodity'),
    }),
    asset: z.object({
      _id: z.object({
        identifier: z.string(),
        assetType: z.literal('Commodity'),
      }),
      assetType: z.literal('Commodity'),
      name: z.string(),
      logo: z.url(),
      popularityScore: z.number(),
      score: z.number(),
    }),
    score: z.number(),
  }),
  z.looseObject({
    name: z.string(),
    assetType: z.literal('Crypto'),
    assetId: z.object({
      identifier: z.string(),
      assetType: z.literal('Crypto'),
    }),
    asset: z.looseObject({
      _id: z.object({
        identifier: z.string(),
        assetType: z.literal('Crypto'),
      }),
      assetType: z.literal('Crypto'),
      name: z.string(),
      logo: z.url(),
      crypto: z.object({
        website: z.url().or(z.string()).optional(),
        symbol: z.string(),
      }),
      score: z.number(),
    }),
    score: z.number(),
    crypto: z.looseObject({
      symbol: z.string(),
      name: z.string(),
      logo: z.url(),
      website: z.url().or(z.string()).optional(),
    }),
  }),
]);

const SearchResponse = z.object({
  fallbackResults: z.boolean(),
  results: z.array(SearchResultItem),
});

const AssetQuote = z.object({
  assetId: z.object({
    identifier: ISIN,
    assetType: AssetType,
  }),
  assetIdentifier: ISIN,
  interval: z.object({
    from: common.ZodDate,
    to: common.ZodDate,
    timeframe: z.string(),
  }),
  from: common.ZodDate,
  currency: common.CurrencyCode,
  quotes: z.array(
    z.object({
      date: common.ZodDate,
      price: z.number(),
    }),
  ),
  priceChart: z.array(
    z.object({
      values: z.object({price: z.number()}),
      date: common.ZodDate,
      mark: z.enum(['bod', 'eod', 'most_recent', 'mark']),
    }),
  ),
  exchange: z.string().optional(), // FIXME: Use actual technical type for stock-exchanges
});

const DividendDetails = z.object({
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

const RelatedAsset = z.object({
  asset: z.discriminatedUnion('assetType', [
    z.object({
      _id: z.object({identifier: ISIN, assetType: z.literal('Security')}),
      assetType: z.literal('Security'),
      name: z.string(),
      logo: z.url(),
      security: z.discriminatedUnion('type', [
        z.object({
          type: z.literal('Aktie'),
          website: z.url(),
          wkn: WKN,
          isin: ISIN,
          sectors: z.array(AssetSecurityCategorySplit),
        }),
        z.object({
          type: z.literal('ETF'),
          website: z.url(),
          factsheet: z.url().optional(),
          wkn: WKN,
          isin: ISIN,
          etfDomicile: common.CountryCode,
          etfCompany: z.string(),
          sectors: z.array(AssetSecurityCategorySplit),
        }),
        z.object({
          type: z.literal('Zertifikat'),
          website: z.url(),
          wkn: WKN.or(z.string()),
          isin: ISIN,
          sectors: z.array(AssetSecurityCategorySplit),
        }),
      ]),
    }),
    z.object({
      _id: z.object({
        identifier: z.string(),
        assetType: z.literal('Commodity'),
      }),
      assetType: z.literal('Commodity'),
      name: z.string(),
      logo: z.url(),
    }),
    z.object({
      _id: z.object({identifier: z.string(), assetType: z.literal('Crypto')}),
      assetType: z.literal('Crypto'),
      name: z.string(),
      logo: z.url(),
      crypto: z.object({website: z.url(), symbol: z.string()}),
    }),
  ]),
});

const Sector = z.object({
  _id: z.string(),
  labelEN: z.string(),
  labelDE: z.string(),
});

const Region = Sector;
const Industry = Sector;
const Country = z.object({
  _id: z.string().length(2).uppercase(),
  name: z.string(),
  labelDE: z.string(),
  labelGenderDE: z.string().nullable(),
  code: z.string().length(2).uppercase(),
  capital: z.string(),
  region: z.string(),
  currency: z.object({
    code: z.string().length(3).uppercase(),
    name: z.string(),
    symbol: z.string(),
  }),
  language: z.object({
    code: z.string(),
    name: z.string(),
  }),
  flag: z.url(),
});

export const ParqetSchemas = {
  AssetSecurityCategorySplit,
  SecuritySymbol,
  DividendPayoutInterval,
  Dividend,
  Quote,
  IncomeStatementGrowth,
  FinancialResult,
  AnalystEstimates,
  SecurityAnalysis,
  PriceTargetConsensus,
  News,
  PartnerNews,
  SecurityScoring,
  DividendKPI,
  Asset,
  SearchResultItem,
  SearchResponse,
  AssetQuote,
  DividendDetails,
  RelatedAsset,
  Sector,
  Region,
  Industry,
  Country,
};
