import type {TBudget} from '@budgetbuddyde/api/budget';
import type {TCategoryVH} from '@budgetbuddyde/api/category';
import {apiClient} from '@/apiClient';
import {getForwardedHeaders} from '@/lib/server-headers';

export async function loadBudgetPage(
  period: string,
  search?: string,
): Promise<{budgets: TBudget[]; categories: TCategoryVH[]; error?: string}> {
  const headers = await getForwardedHeaders();
  const [budgetResult, categoryResult] = await Promise.all([
    apiClient.backend.budget.getAll({from: 0, to: 100, $period: period, search}, {headers, cache: 'no-store'}),
    apiClient.backend.category.getValueHelp({headers, cache: 'no-store'}),
  ]);
  return {
    budgets: budgetResult[0]?.data ?? [],
    categories: categoryResult[0] ?? [],
    error: budgetResult[1] || categoryResult[1] ? 'Budgets and category data could not be loaded.' : undefined,
  };
}
