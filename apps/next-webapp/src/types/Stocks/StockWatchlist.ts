import {z} from 'zod';

import {IdAspect, ManagedAspect, OptionalIdAspect} from '../_Aspects';
import {ODataContextAspect, OwnerAspect} from '../_Base';
import {StockExchange} from './StockExchange';
import {ISIN} from './StockPosition';

// Base model
export const StockWatchlist = z.object({
  ...IdAspect.shape,
  toExchange_symbol: StockExchange.shape.symbol,
  isin: ISIN,
  targetPrice: z.number().positive({message: 'Purchase price must be positive'}),
  ...OwnerAspect.shape,
  ...ManagedAspect.shape,
});
export type TStockWatchlist = z.infer<typeof StockWatchlist>;

export const ExpandedStockWatchlist = StockWatchlist.omit({
  toExchange_symbol: true,
}).extend({
  toExchange: StockExchange,
});
export type TExpandedStockWatchlist = z.infer<typeof ExpandedStockWatchlist>;

export const CreateorUpdateStockWatchlist = StockWatchlist.pick({
  toExchange_symbol: true,
  isin: true,
  targetPrice: true,
}).merge(OptionalIdAspect);
export type TCreateOrUpdateStockWatchlist = z.infer<typeof CreateorUpdateStockWatchlist>;

// Response from OData
export const StockWatchlistResponse = StockWatchlist.extend(ODataContextAspect.shape);
export type TStockWatchlistResponse = z.infer<typeof StockWatchlistResponse>;
