import {type TExpandedBudgetProgress} from '@budgetbuddyde/types';

import {type TGenericHook} from '@/hooks/GenericHook';

import {useBudgetStore} from './Budget.store';

export function useBudgets(): TGenericHook<TExpandedBudgetProgress[]> {
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    useBudgetStore();

  return {
    data: getData(),
    refreshData,
    isLoading,
    isFetched,
    fetchedAt,
    fetchedBy,
    hasError,
    error,
    resetStore,
  };
}
