import type {TExecutionPlan} from '@budgetbuddyde/api/recurringPayment';

export const executionPlanOptions: Array<{value: TExecutionPlan; label: string}> = [
  {value: 'daily', label: 'Daily'},
  {value: 'weekly', label: 'Weekly'},
  {value: 'biweekly', label: 'Every two weeks'},
  {value: 'monthly', label: 'Monthly'},
  {value: 'quarterly', label: 'Quarterly'},
  {value: 'yearly', label: 'Yearly'},
];

export const executionPlanLabels = Object.fromEntries(
  executionPlanOptions.map(option => [option.value, option.label]),
) as Record<TExecutionPlan, string>;
