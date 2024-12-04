import {z} from 'zod';
import {ZDate} from './Base.type';
import {ZId} from './PocketBase.types';

export const ZMonthlyBalance = z.object({
  id: z.string(),
  date: ZDate,
  balance: z.number(),
  income: z.number(),
  expenses: z.number(),
  owner: ZId,
});
export type TMonthlyBalance = z.infer<typeof ZMonthlyBalance>;
