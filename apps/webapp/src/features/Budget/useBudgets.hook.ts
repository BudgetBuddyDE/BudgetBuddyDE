import {type TGenericHook} from '@/hooks/GenericHook';
import {type TExpandedBudget} from '@/newTypes';

import {useBudgetStore} from './Budget.store';

export function useBudgets(): TGenericHook<TExpandedBudget[]> {
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
