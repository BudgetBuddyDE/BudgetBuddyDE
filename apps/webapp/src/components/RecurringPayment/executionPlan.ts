import type {TExecutionPlan} from '@budgetbuddyde/api/recurringPayment';
import {englishTranslator, type AppTranslator} from '@/i18n/translate';

export const getExecutionPlanOptions = (t: AppTranslator): Array<{value: TExecutionPlan; label: string}> => [
  {value: 'daily', label: t('recurringPayments.daily')},
  {value: 'weekly', label: t('recurringPayments.weekly')},
  {value: 'biweekly', label: t('recurringPayments.biweekly')},
  {value: 'monthly', label: t('recurringPayments.monthly')},
  {value: 'quarterly', label: t('recurringPayments.quarterly')},
  {value: 'yearly', label: t('recurringPayments.yearly')},
];

export const getExecutionPlanLabels = (t: AppTranslator) =>
  Object.fromEntries(getExecutionPlanOptions(t).map(option => [option.value, option.label])) as Record<
    TExecutionPlan,
    string
  >;

export const executionPlanOptions = getExecutionPlanOptions(englishTranslator);
export const executionPlanLabels = getExecutionPlanLabels(englishTranslator);
