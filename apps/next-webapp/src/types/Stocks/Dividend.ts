import { z } from 'zod';
import { ISIN, ParqetSchemas } from '@budgetbuddyde/types';

export const Dividend = ParqetSchemas.Dividend.pick({
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
