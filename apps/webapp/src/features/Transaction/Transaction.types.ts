import {z} from 'zod';

export const ZTransactionBudget = z.object({
  expenses: z.number(),
  freeAmount: z.number(),
  upcomingExpenses: z.number(),
});
export type TTransactionBudget = z.infer<typeof ZTransactionBudget>;
