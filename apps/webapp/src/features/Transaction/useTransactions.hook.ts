import {type TServiceResponse} from '@budgetbuddyde/types';
import {format} from 'date-fns';

import {useFilterStore} from '@/components/Filter';
import {type TGenericHook} from '@/hooks/GenericHook';
import {type TTransaction} from '@/newTypes';
import {preparePockebaseRequestOptions} from '@/utils';

import {type TTransactionStoreFetchArgs, useTransactionStore} from './Transaction.store';
import {
  type TTransactionBudget,
  type TTransactionStats,
  ZTransactionBudget,
  ZTransactionStats,
} from './Transaction.types';
import {TransactionService} from './TransactionService';
import {buildFetchArgsFromFilter} from './buildFetchArgsFromFilter.util';

interface AdditionalFuncs<T> {
  getLatestTransactions: (count: number, offset?: number) => T;
  getPaidExpenses: () => ReturnType<typeof TransactionService.getPaidExpenses>;
  getReceivedIncome: () => ReturnType<typeof TransactionService.getReceivedIncome>;
  getUpcomingAsTransactions: (type: 'EXPENSES' | 'INCOME') => T;
  getUpcoming: (type: 'EXPENSES' | 'INCOME') => number;
  getStats: (starDate: Date, endDate: Date) => Promise<TServiceResponse<TTransactionStats>>;
  getBudget: (startDate: Date, endDate: Date) => Promise<TServiceResponse<TTransactionBudget>>;
}

export function useTransactions(): TGenericHook<
  TTransaction[],
  AdditionalFuncs<TTransaction[]>,
  TTransactionStoreFetchArgs
> {
  const POCKETBASE_HOST = import.meta.env.VITE_POCKETBASE_HOST;
  const {filters} = useFilterStore();
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    useTransactionStore();

  const triggerReFetch = async (updateLoadingState?: boolean, requestFilters = filters) => {
    return await refreshData(updateLoadingState, buildFetchArgsFromFilter(requestFilters));
  };

  const getLatestTransactions: AdditionalFuncs<TTransaction[]>['getLatestTransactions'] = (_count, _offset = 0) => {
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

  const getUpcomingAsTransactions: AdditionalFuncs<TTransaction[]>['getUpcomingAsTransactions'] = _type => {
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

  const getStats: AdditionalFuncs<TTransaction[]>['getStats'] = async (startDate, endDate) => {
    if (!POCKETBASE_HOST) return [null, new Error('Pocketbase URL not set')];

    const query = new URLSearchParams({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }).toString();
    const response = await fetch(`${POCKETBASE_HOST}/transactions/stats?${query}`, {
      ...preparePockebaseRequestOptions(),
    });
    const json = await response.json();

    const parsedResult = ZTransactionStats.safeParse(json);
    return parsedResult.error ? [null, parsedResult.error] : [parsedResult.data, null];
  };

  const getBudget: AdditionalFuncs<TTransaction[]>['getBudget'] = async (startDate, endDate) => {
    if (!POCKETBASE_HOST) return [null, new Error('Pocketbase URL not set')];

    const query = new URLSearchParams({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }).toString();
    const response = await fetch(`${POCKETBASE_HOST}/transactions/budget?${query}`, {
      ...preparePockebaseRequestOptions(),
    });
    const json = await response.json();

    const parsedResult = ZTransactionBudget.safeParse(json);
    return parsedResult.error ? [null, parsedResult.error] : [parsedResult.data, null];
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
