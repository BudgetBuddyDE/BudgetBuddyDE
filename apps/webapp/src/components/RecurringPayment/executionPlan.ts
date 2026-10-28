import type {TExecutionPlan} from '@budgetbuddyde/api/recurringPayment';

export const executionPlanOptions: Array<{value: TExecutionPlan; labelKey: string}> = [
  {value: 'daily', labelKey: 'daily'},
  {value: 'weekly', labelKey: 'weekly'},
  {value: 'biweekly', labelKey: 'biweekly'},
  {value: 'monthly', labelKey: 'monthly'},
  {value: 'quarterly', labelKey: 'quarterly'},
  {value: 'yearly', labelKey: 'yearly'},
];
