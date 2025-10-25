import { z } from 'zod';
import { CdsDate } from '../_Aspects';
import { ODataContextAspect, ODataCountAspect } from '../_Base';

// Base model
export const StockExchange = z.object({
  symbol: z.string().min(1).max(25),
  name: z.string().min(1).max(50),
  technicalName: z.string().min(1).max(50),
  createdAt: CdsDate,
  modifiedAt: CdsDate,
});
export type TStockExchange = z.infer<typeof StockExchange>;

export const StockExchangeVH = StockExchange.pick({
  symbol: true,
  name: true,
  technicalName: true,
});
export type TStockExchangeVH = z.infer<typeof StockExchangeVH>;

/**
 * Stock Exchanges with Count
 */
export const StockExchangesWithCount = z.object({
  ...ODataContextAspect.shape,
  ...ODataCountAspect.shape,
  value: z.array(StockExchange),
});
/**
 * Transactions with Count
 */
export type TStockExchangesWithCount = z.infer<typeof StockExchangesWithCount>;
