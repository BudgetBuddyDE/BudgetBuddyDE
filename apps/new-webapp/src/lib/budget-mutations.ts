import type {TBudget, TCreateOrUpdateBudgetPayload} from '@budgetbuddyde/api/budget';
import {apiClient} from '@/apiClient';
import {parseMoneyToMinorUnits} from '@/utils/money';

export interface BudgetDraft {
  name: string;
  type: 'i' | 'e';
  amount: string;
  period: string;
  warningThreshold: string;
  categoryIds: string[];
  description: string;
}

export function budgetToDraft(budget?: TBudget): BudgetDraft {
  const defaultPeriod = new Intl.DateTimeFormat('en-CA', {year: 'numeric', month: '2-digit'}).format(new Date());
  return budget
    ? {
        name: budget.name,
        type: budget.type,
        amount: budget.budget.toFixed(2),
        period: budget.period,
        warningThreshold: String(budget.warningThreshold),
        categoryIds: budget.categories.map(link => link.category.id),
        description: budget.description ?? '',
      }
    : {
        name: '',
        type: 'e',
        amount: '',
        period: defaultPeriod,
        warningThreshold: '80',
        categoryIds: [],
        description: '',
      };
}

export async function saveBudget(draft: BudgetDraft, id?: string): Promise<{success: boolean; error?: string}> {
  const minor = parseMoneyToMinorUnits(draft.amount);
  const threshold = Number(draft.warningThreshold);
  if (!draft.name.trim()) return {success: false, error: 'Enter a budget name.'};
  if (minor === null) return {success: false, error: 'Enter a valid budget amount.'};
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(draft.period)) return {success: false, error: 'Select a valid month.'};
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100)
    return {success: false, error: 'Warning threshold must be between 1 and 100.'};
  if (!draft.categoryIds.length) return {success: false, error: 'Select at least one category.'};
  const payload: TCreateOrUpdateBudgetPayload = {
    name: draft.name.trim(),
    type: draft.type,
    budget: minor / 100,
    period: draft.period,
    warningThreshold: threshold,
    categories: draft.categoryIds as TCreateOrUpdateBudgetPayload['categories'],
    description: draft.description.trim() || null,
  };
  const [, error] = id
    ? await apiClient.backend.budget.updateById(id, payload)
    : await apiClient.backend.budget.create(payload);
  return error ? {success: false, error: 'The budget could not be saved.'} : {success: true};
}

export async function deleteBudget(id: string): Promise<boolean> {
  const [, error] = await apiClient.backend.budget.deleteById(id);
  return !error;
}
