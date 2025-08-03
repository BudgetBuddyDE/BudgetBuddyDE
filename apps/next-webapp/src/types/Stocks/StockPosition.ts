import {z} from 'zod';

import {CdsDate, IdAspect, ManagedAspect, OptionalIdAspect} from '../_Aspects';
import {DescriptionType, ODataContextAspect, OwnerAspect} from '../_Base';
import {StockExchange} from './StockExchange';

export const ISIN = z.string().min(12).max(12);

// Base model
export const StockPosition = z.object({
  ...IdAspect.shape,
  toExchange_symbol: StockExchange.shape.symbol,
  isin: ISIN,
  quantity: z.number().positive({message: 'Quantity must be positive'}),
  purchasedAt: CdsDate,
  purchasePrice: z.number().positive({message: 'Purchase price must be positive'}),
  description: DescriptionType,
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
