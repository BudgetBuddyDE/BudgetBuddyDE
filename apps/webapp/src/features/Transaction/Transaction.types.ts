import {ZDate} from '@budgetbuddyde/types';
import {z} from 'zod';

export const ZTransactionStats = z.object({
  startDate: ZDate,
  endDate: ZDate,
  balance: z.object({
    current: z.number(),
    estimated: z.number(),
  }),
  expenses: z.object({
    received: z.number(),
    upcoming: z.number(),
  }),
  income: z.object({
    received: z.number(),
    upcoming: z.number(),
  }),
});
export type TTransactionStats = z.infer<typeof ZTransactionStats>;

export const ZTransactionBudget = z.object({
  startDate: ZDate,
  endDate: ZDate,
  expenses: z.number(),
  freeAmount: z.number(),
  upcomingExpenses: z.number(),
});
export type TTransactionBudget = z.infer<typeof ZTransactionBudget>;
