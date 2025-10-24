import { z } from 'zod';

import { CdsDate, IdAspect, ManagedAspect, OptionalIdAspect } from '../_Aspects';
import { DescriptionType, ODataContextAspect, ODataCountAspect, OwnerAspect } from '../_Base';
import { StockExchange } from './StockExchange';
import {
  AnalystEstimates,
  AssetIdentifier,
  AssetType,
  CurrencyCode,
  Dividend,
  DividendKPI,
  FinancialResult,
  IncomeStatementGrowth,
  ISIN,
  News,
  PriceTargetConsensus,
  SecurityScoring,
  SecuritySymbol,
  SecurityType,
  WKN,
  ZodDate,
} from './Parqet';
import { Timeframe } from '@/components/Stocks/AssetPriceChart';

// Base model
export const StockPosition = z.object({
  ...IdAspect.shape,
  toExchange_symbol: StockExchange.shape.symbol,
  logoUrl: z.url(),
  assetType: AssetType,
  securityName: z.string(),
  isin: ISIN,
  quantity: z.number().positive({ message: 'Quantity must be positive' }),
  purchasedAt: CdsDate,
  purchasePrice: z.number().positive({ message: 'Purchase price must be positive' }),
  purchaseFee: z.number().min(0, { message: 'Purchase fee cannot be negative' }).default(0),
  description: DescriptionType,
  currentPrice: z.number(),
  positionValue: z.number(),
  absoluteProfit: z.number(),
  relativeProfit: z.number(),
  ...OwnerAspect.shape,
  ...ManagedAspect.shape,
});
export type TStockPosition = z.infer<typeof StockPosition>;

export const ExpandedStockPosition = StockPosition.omit({
  toExchange_symbol: true,
}).extend({
  toExchange: StockExchange,
});
export type TExpandedStockPosition = z.infer<typeof ExpandedStockPosition>;

/**
 * Stock Positions with Count
 */
export const StockPositionsWithCount = z.object({
  ...ODataContextAspect.shape,
  ...ODataCountAspect.shape,
  value: z.array(ExpandedStockPosition),
});
/**
 * Stock Positions with Count
 */
export type TStockPositionsWithCount = z.infer<typeof StockPositionsWithCount>;

export const StockPositionAllocation = StockPosition.pick({
  isin: true,
  securityName: true,
}).extend({
  absolutePositionSize: z.number(),
  relativePositionSize: z.number(),
});
export type TStockPositionAllocation = z.infer<typeof StockPositionAllocation>;

export const CreateorUpdateStockPosition = StockPosition.pick({
  toExchange_symbol: true,
  isin: true,
  quantity: true,
  purchasedAt: true,
  purchasePrice: true,
  purchaseFee: true,
  description: true,
}).merge(OptionalIdAspect);
export type TCreateOrUpdateStockPosition = z.infer<typeof CreateorUpdateStockPosition>;

// Response from OData
export const StockPositionResponse = StockPosition.extend(ODataContextAspect.shape);
export type TStockPositionResponse = z.infer<typeof StockPositionResponse>;

export const StockPositionsKPI = z.object({
  '@odata.context': z.string(),
  totalPositionValue: z.number(),
  absoluteCapitalGains: z.number(),
  unrealisedProfit: z.number(),
  freeCapitalOnProfitablePositions: z.number(),
  unrealisedLoss: z.number(),
  boundCapitalOnLosingPositions: z.number(),
  upcomingDividends: z.number(),
});
export type TStockPositionsKPI = z.infer<typeof StockPositionsKPI>;

export const RelatedAssetQuote = z.object({
  identifier: AssetIdentifier,
  date: ZodDate,
  currency: CurrencyCode,
  price: z.number(),
});
export type TRelatedAssetQuote = z.infer<typeof RelatedAssetQuote>;

export const RelatedAsset = z.object({
  identifier: AssetIdentifier,
  assetType: AssetType,
  securityName: z.string(),
  securityType: z.union([SecurityType, z.enum(['Crypto', 'Commodity'])]),
  logoUrl: z.string(),
  quotes: z.array(RelatedAssetQuote).optional(),
});
export type TRelatedAsset = z.infer<typeof RelatedAsset>;

///

const StaticMapping = z.object({
  id: z.string(),
  name: z.string(),
  share: z.number(),
});

const UpdatedDividend = Dividend.extend({
  declarationDate: ZodDate.nullable(),
  recordDate: ZodDate.nullable(),
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
  ipoDate: ZodDate.nullable(),
  currency: CurrencyCode.nullable(),
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
      currency: CurrencyCode,
      description: z.string(),
      nav: z.number(),
      priceToBook: z.number(),
      priceToEarnings: z.number(),
      aum: z.number(),
      expenseRatio: z.number(),
      breakdown: z.object({
        updatedAt: ZodDate,
        holdings: z.array(
          z.object({
            name: z.string(),
            share: z.number(),
            marketValue: z.number(),
            amountOfShares: z.number(),
          })
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
    annual: z.array(FinancialResult),
    quarterly: z.array(FinancialResult),
    incomeStatementGrowth: z.array(IncomeStatementGrowth),
  }),
  symbols: z.array(SecuritySymbol),
  dividends: z.object({
    payoutInterval: z.string(), // REVISIT: ApiSchemas.DividendPayoutInterval,
    historical: z.array(UpdatedDividend),
    future: z.array(UpdatedDividend),
    KPIs: DividendKPI.nullable(),
    yearlyTTM: z
      .array(
        z.object({
          year: z.string(),
          dividend: z.number(),
        })
      )
      .nullable(),
  }),
  analysis: z.object({
    priceTargetConsensus: PriceTargetConsensus.nullable(),
    recommendation: AnalystEstimates,
    scorings: z.array(SecurityScoring),
    media: z.array(
      z.object({
        analysisDate: ZodDate,
        mediaType: z.enum(['video', 'article']).or(z.string()),
        ratingCount: z.number(),
        rating: z.number(),
        author: z.string(),
        title: z.string(),
        url: z.url(),
      })
    ),
  }),
  regions: z.array(StaticMapping),
  countries: z.array(StaticMapping),
  sectors: z.array(StaticMapping),
  industries: z.array(StaticMapping),
  news: z.array(News),
});
export type TAsset = z.infer<typeof Asset>;

export const AssetQuote = z.object({
  identifier: AssetIdentifier,
  from: ZodDate,
  to: ZodDate,
  timeframe: Timeframe,
  exchange: z.string(),
  currency: CurrencyCode,
  quotes: z.array(
    z.object({
      date: ZodDate,
      price: z.number(),
    })
  ),
});
export type TAssetQuote = z.infer<typeof AssetQuote>;

export const AssetServiceSchemas = Object.assign({}, { Asset, AssetQuote });
