import type {TExecutionPlan} from '@budgetbuddyde/api/recurringPayment';
import type {AppTranslator} from '@/lib/i18n/translate';

export const getExecutionPlanOptions = (t: AppTranslator): Array<{value: TExecutionPlan; label: string}> => [
  {value: 'daily', label: t('Daily')},
  {value: 'weekly', label: t('Weekly')},
  {value: 'biweekly', label: t('BiWeekly')},
  {value: 'monthly', label: t('Monthly')},
  {value: 'quarterly', label: t('Quarterly')},
  {value: 'yearly', label: t('Yearly')},
];

export const getExecutionPlanLabels = (t: AppTranslator) =>
  Object.fromEntries(getExecutionPlanOptions(t).map(option => [option.value, option.label])) as Record<
    TExecutionPlan,
    string
  >;

export const executionPlanOptions = getExecutionPlanOptions(source => source);
export const executionPlanLabels = getExecutionPlanLabels(source => source);
