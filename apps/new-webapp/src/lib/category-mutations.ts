import type {TCategory, TCreateOrUpdateCategoryPayload} from '@budgetbuddyde/api/category';
import {apiClient} from '@/apiClient';
import {parseMoneyToMinorUnits} from '@/utils/money';

export interface CategoryDraft {
  name: string;
  type: 'income' | 'expense' | 'both';
  color: string;
  icon: string;
  budgetTarget: string;
  description: string;
}

export interface CategoryImpact {
  transactions: number;
  recurringPayments: number;
}

export function categoryToDraft(category?: TCategory): CategoryDraft {
  return category
    ? {
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
        budgetTarget: category.budgetTarget === null ? '' : category.budgetTarget.toFixed(2),
        description: category.description ?? '',
      }
    : {name: '', type: 'expense', color: '#64748b', icon: 'circle', budgetTarget: '', description: ''};
}

function categoryPayload(draft: CategoryDraft): {payload?: TCreateOrUpdateCategoryPayload; error?: string} {
  const name = draft.name.trim();
  if (!name) return {error: 'Enter a category name.'};
  if (!/^#[0-9a-fA-F]{6}$/.test(draft.color)) return {error: 'Choose a valid six-digit color.'};
  const targetMinor = draft.budgetTarget ? parseMoneyToMinorUnits(draft.budgetTarget) : null;
  if (draft.budgetTarget && targetMinor === null)
    return {error: 'Enter a budget target with at most two decimal places.'};
  return {
    payload: {
      name,
      type: draft.type,
      color: draft.color,
      icon: draft.icon.trim() || 'circle',
      budgetTarget: targetMinor === null ? null : targetMinor / 100,
      description: draft.description.trim() || null,
    },
  };
}

export async function saveCategory(draft: CategoryDraft, id?: string): Promise<{success: boolean; error?: string}> {
  const parsed = categoryPayload(draft);
  if (!parsed.payload) return {success: false, error: parsed.error};
  const [, error] = id
    ? await apiClient.backend.category.updateById(id, parsed.payload)
    : await apiClient.backend.category.create(parsed.payload);
  return error ? {success: false, error: 'The category could not be saved.'} : {success: true};
}

export async function inspectCategoryImpact(id: TCategory['id']): Promise<CategoryImpact | null> {
  const [transactions, recurring] = await Promise.all([
    apiClient.backend.transaction.getAll({$categories: [id], from: 0, to: 1}),
    apiClient.backend.recurringPayment.getAll({$categories: [id], from: 0, to: 1}),
  ]);
  if (transactions[1] || recurring[1]) return null;
  return {transactions: transactions[0]?.totalCount ?? 0, recurringPayments: recurring[0]?.totalCount ?? 0};
}

export async function deleteCategory(id: TCategory['id']): Promise<boolean> {
  const impact = await inspectCategoryImpact(id);
  if (!impact || impact.transactions > 0 || impact.recurringPayments > 0) return false;
  const [, error] = await apiClient.backend.category.deleteById(id);
  return !error;
}

export async function mergeCategories(source: TCategory['id'][], target: TCategory['id']): Promise<boolean> {
  const [, error] = await apiClient.backend.category.merge({source, target});
  return !error;
}
