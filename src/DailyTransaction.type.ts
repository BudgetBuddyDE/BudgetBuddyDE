import {z} from 'zod';
import {ZDate} from './Base.type';

export enum EDailyTransactionType {
  INCOME = 'INCOME',
  SPENDINGS = 'SPENDINGS',
  BALANCE = 'BALANCE',
}

export const ZDailyTransaction = z.object({
  date: ZDate,
  amount: z.number(),
});
export type TDailyTransaction = z.infer<typeof ZDailyTransaction>;
