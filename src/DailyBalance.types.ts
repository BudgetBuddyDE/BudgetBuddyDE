import {z} from 'zod';
import {ZDate} from './Base.type';
import {ZId} from './PocketBase.types';

export const ZDailyBalance = z.object({
  id: z.string(),
  date: ZDate,
  balance: z.number(),
  income: z.number(),
  expenses: z.number(),
  owner: ZId,
});
export type TDailyBalance = z.infer<typeof ZDailyBalance>;
