import {type TServiceResponse} from '@budgetbuddyde/types';

import {useFilterStore} from '@/components/Filter';
import {type TGenericHook} from '@/hooks/GenericHook';
import {type TExpandedTransaction, type TMonthlyKPIResponse, type TTransaction} from '@/newTypes';

import {type TTransactionStoreFetchArgs, useTransactionStore} from './Transaction.store';
import {type TTransactionBudget} from './Transaction.types';
import {TransactionService} from './TransactionService';
import {buildFetchArgsFromFilter} from './buildFetchArgsFromFilter.util';

interface AdditionalFuncs<T> {
  getLatestTransactions: (count: number, offset?: number) => T;
  getPaidExpenses: () => ReturnType<typeof TransactionService.getPaidExpenses>;
  getReceivedIncome: () => ReturnType<typeof TransactionService.getReceivedIncome>;
  getUpcomingAsTransactions: (type: 'EXPENSES' | 'INCOME') => T;
  getUpcoming: (type: 'EXPENSES' | 'INCOME') => number;
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

  const getLatestTransactions: AdditionalFuncs<TExpandedTransaction[]>['getLatestTransactions'] = (
    _count,
    _offset = 0,
  ) => {
    // FIXME: return TransactionService.getLatestTransactions(getData() ?? [], count, offset);
    return [];
  };

  const getPaidExpenses: AdditionalFuncs<TTransaction[]>['getPaidExpenses'] = () => {
    // FIXME: return TransactionService.getPaidExpenses(getData() ?? []);
    return [];
  };

  const getReceivedIncome: AdditionalFuncs<TTransaction[]>['getReceivedIncome'] = () => {
    // FIXME: return TransactionService.getReceivedIncome(getData() ?? []);
    return 0;
  };

  const getUpcomingAsTransactions: AdditionalFuncs<TExpandedTransaction[]>['getUpcomingAsTransactions'] = _type => {
    // const today = new Date();
    // const transactions = getData() ?? [];
    // return transactions.filter(
    //   s =>
    //     ((type === 'EXPENSES' && s.transfer_amount < 0) || (type === 'INCOME' && s.transfer_amount > 0)) &&
    //     today < s.processed_at,
    // );

    return [];
  };

  const getUpcoming: AdditionalFuncs<TTransaction[]>['getUpcoming'] = type => {
    return getUpcomingAsTransactions(type).reduce((prev, curr) => prev + Math.abs(curr.transferAmount), 0);
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
    getLatestTransactions,
    getPaidExpenses,
    getReceivedIncome,
    getUpcomingAsTransactions,
    getUpcoming,
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
