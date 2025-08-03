import {z} from 'zod';

import {ODataContextAspect} from './_Base';

export const MonthlyKPI = z.object({
  receivedIncome: z.number(),
  upcomingIncome: z.number(),
  paidExpenses: z.number(),
  upcomingExpenses: z.number(),
  currentBalance: z.number(),
  estimatedBalance: z.number(),
});
export type TMonthlyKPI = z.infer<typeof MonthlyKPI>;

// OData response
export const MonthlyKPIResponse = MonthlyKPI.extend(ODataContextAspect.shape);
export type TMonthlyKPIResponse = z.infer<typeof MonthlyKPIResponse>;
