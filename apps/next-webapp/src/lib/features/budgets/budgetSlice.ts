import { createEntitySlice } from '../createEntitySlice';
import { BudgetService } from '@/services/Budget.service';

export const budgetSlice = createEntitySlice('budget', (query) =>
  BudgetService.getWithCount(query)
);
