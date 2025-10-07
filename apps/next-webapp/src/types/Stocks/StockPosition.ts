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

export const CreateorUpdateStockPosition = StockPosition.pick({
  toExchange_symbol: true,
  isin: true,
  quantity: true,
  purchasedAt: true,
  purchasePrice: true,
  description: true,
}).merge(OptionalIdAspect);
export type TCreateOrUpdateStockPosition = z.infer<typeof CreateorUpdateStockPosition>;

// Response from OData
export const StockPositionResponse = StockPosition.extend(ODataContextAspect.shape);
export type TStockPositionResponse = z.infer<typeof StockPositionResponse>;
