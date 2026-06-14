import {z} from 'zod';
import {common} from '../common';
import {AssetIdentifier, AssetType, SecurityType, Timeframe, WKN} from './base';
import {ParqetSchemas} from './parqet';

const StaticMapping = z.object({
  id: z.string(),
  name: z.string(),
  share: z.number(),
});

const UpdatedDividend = ParqetSchemas.Dividend.extend({
  declarationDate: common.ZodDate.nullable(),
  recordDate: common.ZodDate.nullable(),
});

const Asset = z.object({
  identifier: AssetIdentifier,
  wkn: WKN.nullable(),
  name: z.string(),
  etfDomicile: z.string().nullable(),
  etfCompany: z.string().nullable(),
  securityType: z.union([SecurityType, z.literal('Crypto'), z.literal('Commodity')]),
  assetType: AssetType,
  description: z.string().nullable(),
  hasDividends: z.boolean(),
  logoUrl: z.string().nullable(),
  ipoDate: common.ZodDate.nullable(),
  currency: common.CurrencyCode.nullable(),
  marketCap: z.number().nullable(),
  shares: z.number().nullable(),
  beta: z.number().nullable(),
  peRatioTTM: z.number().nullable(),
  priceSalesRatioTTM: z.number().nullable(),
  priceToBookRatioTTM: z.number().nullable(),
  pegRatioTTM: z.number().nullable(),
  priceFairValueRatio: z.number().nullable(),
  dividendYieldPercentageTTM: z.number().nullable(),
  dividendPerShareTTM: z.number().nullable(),
  payoutRatioTTM: z.number().nullable(),
  etfDetails: z
    .object({
      currency: common.CurrencyCode,
      description: z.string(),
      nav: z.number(),
      priceToBook: z.number(),
      priceToEarnings: z.number(),
      aum: z.number(),
      expenseRatio: z.number(),
      breakdown: z.object({
        updatedAt: common.ZodDate,
        holdings: z.array(
          z.object({
            name: z.string(),
            share: z.number(),
            marketValue: z.number(),
            amountOfShares: z.number(),
          }),
        ),
      }),
    })
    .nullable(),
  fiftyTwoWeekRange: z
    .object({
      from: z.number(),
      to: z.number(),
    })
    .nullable(),
  financials: z.object({
    annual: z.array(ParqetSchemas.FinancialResult),
    quarterly: z.array(ParqetSchemas.FinancialResult),
    incomeStatementGrowth: z.array(ParqetSchemas.IncomeStatementGrowth),
  }),
  symbols: z.array(ParqetSchemas.SecuritySymbol),
  dividends: z.object({
    payoutInterval: ParqetSchemas.DividendPayoutInterval, // REVISIT: ApiSchemas.DividendPayoutInterval,
    historical: z.array(UpdatedDividend),
    future: z.array(UpdatedDividend),
    KPIs: ParqetSchemas.DividendKPI.nullable(),
    yearlyTTM: z
      .array(
        z.object({
          year: z.string(),
          dividend: z.number(),
        }),
      )
      .nullable(),
  }),
  analysis: z.object({
    priceTargetConsensus: ParqetSchemas.PriceTargetConsensus.nullable(),
    recommendation: ParqetSchemas.AnalystEstimates,
    scorings: z.array(ParqetSchemas.SecurityScoring),
    media: z.array(
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
  }),
  regions: z.array(StaticMapping),
  countries: z.array(StaticMapping),
  sectors: z.array(StaticMapping),
  industries: z.array(StaticMapping),
  news: z.array(ParqetSchemas.News),
});

export const AssetQuote = z.object({
  identifier: AssetIdentifier,
  from: common.ZodDate,
  to: common.ZodDate,
  timeframe: Timeframe,
  exchange: z.string(),
  currency: common.CurrencyCode,
  quotes: z.array(
    z.object({
      date: common.ZodDate,
      price: z.number(),
    }),
  ),
});

export const BackendSchemas = {
  Asset,
  AssetQuote,
};
