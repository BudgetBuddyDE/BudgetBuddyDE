import {ZDate} from '@budgetbuddyde/types';
import {z} from 'zod';

export const ZCategoryStats = z.object({
  startDate: ZDate,
  endDate: ZDate,
  categories: z.array(
    z.object({
      category: z.object({
        id: z.string(),
        name: z.string(),
      }),
      balance: z.number(),
      expenses: z.number(),
      income: z.number(),
    }),
  ),
});
export type TCategoryStats = z.infer<typeof ZCategoryStats>;
