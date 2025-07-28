import {type TServiceResponse} from '@budgetbuddyde/types';

import {useFilterStore} from '@/components/Filter';
import {type TGenericHook} from '@/hooks/GenericHook';
import {type TExpandedTransaction, type TMonthlyKPIResponse, type TTransaction} from '@/newTypes';

import {type TTransactionStoreFetchArgs, useTransactionStore} from './Transaction.store';
import {type TTransactionBudget} from './Transaction.types';
import {TransactionService} from './TransactionService';
import {buildFetchArgsFromFilter} from './buildFetchArgsFromFilter.util';

interface AdditionalFuncs<_T> {
  getStats: () => Promise<TServiceResponse<TMonthlyKPIResponse>>;
  getBudget: () => Promise<TServiceResponse<TTransactionBudget>>;
}

export function useTransactions(): TGenericHook<
  TExpandedTransaction[],
  AdditionalFuncs<TExpandedTransaction[]>,
  TTransactionStoreFetchArgs
> {
  const {filters} = useFilterStore();
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    useTransactionStore();

  const triggerReFetch = async (updateLoadingState?: boolean, requestFilters = filters) => {
    return await refreshData(updateLoadingState, buildFetchArgsFromFilter(requestFilters));
  };

  const getStats: AdditionalFuncs<TTransaction[]>['getStats'] = async () => {
    try {
      const stats = await TransactionService.getMonthlyKPIs();
      return [stats, null];
    } catch (e) {
      return [null, e instanceof Error ? e : new Error(String(e))];
    }
  };

  const getBudget: AdditionalFuncs<TTransaction[]>['getBudget'] = async () => {
    try {
      const {paidExpenses, upcomingExpenses, receivedIncome, upcomingIncome} =
        await TransactionService.getMonthlyKPIs();
      return [
        {
          expenses: paidExpenses,
          upcomingExpenses: upcomingExpenses,
          freeAmount: receivedIncome + upcomingIncome - (paidExpenses + upcomingExpenses),
        },
        null,
      ];
    } catch (e) {
      return [null, e instanceof Error ? e : new Error(String(e))];
    }
  };

  return {
    data: getData(buildFetchArgsFromFilter(filters)),
    refreshData: triggerReFetch,
    refreshDataWithFilter: triggerReFetch,
    getStats,
    getBudget,
    isLoading,
    isFetched,
    fetchedAt,
    fetchedBy,
    hasError,
    error,
    resetStore,
  };
}
