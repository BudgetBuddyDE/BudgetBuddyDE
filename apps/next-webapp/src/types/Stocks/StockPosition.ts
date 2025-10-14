import { z } from 'zod';

import { CdsDate, IdAspect, ManagedAspect, OptionalIdAspect } from '../_Aspects';
import { DescriptionType, ODataContextAspect, ODataCountAspect, OwnerAspect } from '../_Base';
import { StockExchange } from './StockExchange';

export const ISIN = z.string().min(12).max(12);
export const AssetType = z.enum(['Security', 'Commodity', 'Crypto']);

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
