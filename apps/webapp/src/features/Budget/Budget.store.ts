import {GenerateGenericStore} from '@/hooks/GenericHook';
import {type TExpandedBudget} from '@/newTypes';

import {BudgetService} from './BudgetService';

export const useBudgetStore = GenerateGenericStore<TExpandedBudget[]>(async () => {
  return await BudgetService.getBudgets();
});
