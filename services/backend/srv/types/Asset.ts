import { z } from "zod";
import { ApiSchemas } from "./Parqet";

const StaticMapping = z.object({
  id: z.string(),
  name: z.string(),
  share: z.number(),
});

const UpdatedDividend = ApiSchemas.Dividend.extend({
  declarationDate: ApiSchemas.ZodDate.nullable(),
  recordDate: ApiSchemas.ZodDate.nullable(),
});

const Asset = z.object({
  identifier: ApiSchemas.AssetIdentifier,
  wkn: ApiSchemas.WKN.nullable(),
  name: z.string(),
  etfDomicile: z.string().nullable(),
  etfCompany: z.string().nullable(),
  securityType: z.union([
    ApiSchemas.SecurityType,
    z.literal("Crypto"),
    z.literal("Commodity"),
  ]),
  assetType: ApiSchemas.AssetType,
  description: z.string().nullable(),
  hasDividends: z.boolean(),
  logoUrl: z.string().nullable(),
  ipoDate: ApiSchemas.ZodDate.nullable(),
  currency: ApiSchemas.CurrencyCode.nullable(),
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
      currency: ApiSchemas.CurrencyCode,
      description: z.string(),
      nav: z.number(),
      priceToBook: z.number(),
      priceToEarnings: z.number(),
      aum: z.number(),
      expenseRatio: z.number(),
      breakdown: z.object({
        updatedAt: ApiSchemas.ZodDate,
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
    annual: z.array(ApiSchemas.FinancialResult),
    quarterly: z.array(ApiSchemas.FinancialResult),
    incomeStatementGrowth: z.array(ApiSchemas.IncomeStatementGrowth),
  }),
  symbols: z.array(ApiSchemas.SecuritySymbol),
  dividends: z.object({
    payoutInterval: z.string(), // REVISIT: ApiSchemas.DividendPayoutInterval,
    historical: z.array(UpdatedDividend),
    future: z.array(UpdatedDividend),
    KPIs: ApiSchemas.DividendKPI.nullable(),
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
    priceTargetConsensus: ApiSchemas.PriceTargetConsensus.nullable(),
    recommendation: ApiSchemas.AnalystEstimates,
    scorings: z.array(ApiSchemas.SecurityScoring),
    media: z.array(
      z.object({
        analysisDate: ApiSchemas.ZodDate,
        mediaType: z.enum(["video", "article"]).or(z.string()),
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
  news: z.array(ApiSchemas.News),
});

export const ResponseSchemas = Object.assign({}, { Asset });
