import { z } from 'zod';
import { Dividend as ParqetDividend } from './Parqet';
import { ISIN } from './StockPosition';

export const Dividend = ParqetDividend.pick({
  price: true,
  currency: true,
  date: true,
  datetime: true,
  paymentDate: true,
  recordDate: true,
  exDate: true,
  isEstimated: true,
}).extend({
  identifier: ISIN,
  payoutInterval: z.enum(['year', 'halfyear', 'quarter', 'month', 'none']),
});
export type TDividend = z.infer<typeof Dividend>;
