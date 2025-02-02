import {type TExpandedBudgetProgress} from '@budgetbuddyde/types';

import {GenerateGenericStore} from '@/hooks/GenericHook';
import {logger} from '@/logger';

import {BudgetService} from './BudgetService';

export const useBudgetStore = GenerateGenericStore<TExpandedBudgetProgress[]>(async () => {
  const [budgets, error] = await BudgetService.getBudgets();
  if (error) logger.error("Was't able to retrieve budgets", error);
  return budgets ?? [];
});
