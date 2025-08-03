import {z} from 'zod';

import {CdsDate} from '../_Aspects';
import {ODataContextAspect} from '../_Base';

// Base model
export const StockExchange = z.object({
  symbol: z.string().min(1).max(25),
  name: z.string().min(1).max(50),
  technicalName: z.string().min(1).max(50),
  createdAt: CdsDate,
  modifiedAt: CdsDate,
});
export type TStockExchange = z.infer<typeof StockExchange>;

// Response from OData
export const StockExchangeResponse = StockExchange.extend(ODataContextAspect.shape);
export type TStockExchangeResponse = z.infer<typeof StockExchangeResponse>;
