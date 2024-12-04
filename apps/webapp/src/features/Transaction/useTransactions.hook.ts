import {type TServiceResponse, type TTransaction} from '@budgetbuddyde/types';
import {format} from 'date-fns';

import {type TGenericHook} from '@/hooks/GenericHook';
import {preparePockebaseRequestOptions} from '@/utils';

import {useTransactionStore} from './Transaction.store';
import {
  type TTransactionBudget,
  type TTransactionStats,
  ZTransactionBudget,
  ZTransactionStats,
} from './Transaction.types';
import {TransactionService} from './TransactionService';

interface AdditionalFuncs<T> {
  getLatestTransactions: (count: number, offset?: number) => T;
  getPaidExpenses: () => ReturnType<typeof TransactionService.getPaidExpenses>;
  getReceivedIncome: () => ReturnType<typeof TransactionService.getReceivedIncome>;
  getUpcomingAsTransactions: (type: 'EXPENSES' | 'INCOME') => T;
  getUpcoming: (type: 'EXPENSES' | 'INCOME') => number;
  getStats: (starDate: Date, endDate: Date) => Promise<TServiceResponse<TTransactionStats>>;
  getBudget: (startDate: Date, endDate: Date) => Promise<TServiceResponse<TTransactionBudget>>;
}

export function useTransactions(): TGenericHook<TTransaction[], AdditionalFuncs<TTransaction[]>> {
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    useTransactionStore();

  const getLatestTransactions: AdditionalFuncs<TTransaction[]>['getLatestTransactions'] = (count, offset = 0) => {
    return TransactionService.getLatestTransactions(getData() ?? [], count, offset);
  };

  const getPaidExpenses: AdditionalFuncs<TTransaction[]>['getPaidExpenses'] = () => {
    return TransactionService.getPaidExpenses(getData() ?? []);
  };

  const getReceivedIncome: AdditionalFuncs<TTransaction[]>['getReceivedIncome'] = () => {
    return TransactionService.getReceivedIncome(getData() ?? []);
  };

  const getUpcomingAsTransactions: AdditionalFuncs<TTransaction[]>['getUpcomingAsTransactions'] = type => {
    const today = new Date();
    const transactions = getData() ?? [];
    return transactions.filter(
      s =>
        ((type === 'EXPENSES' && s.transfer_amount < 0) || (type === 'INCOME' && s.transfer_amount > 0)) &&
        today < s.processed_at,
    );
  };

  const getUpcoming: AdditionalFuncs<TTransaction[]>['getUpcoming'] = type => {
    const acc: number = getUpcomingAsTransactions(type).reduce(
      (prev, curr) => prev + Math.abs(curr.transfer_amount),
      0,
    );
    return acc;
  };

  const getStats: AdditionalFuncs<TTransaction[]>['getStats'] = async (startDate, endDate) => {
    if (!process.env.POCKETBASE_URL) return [null, new Error('Pocketbase URL not set')];

    const query = new URLSearchParams({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }).toString();
    const response = await fetch(`${process.env.POCKETBASE_URL}/transactions/stats?${query}`, {
      ...preparePockebaseRequestOptions(),
    });
    const json = await response.json();

    const parsedResult = ZTransactionStats.safeParse(json);
    return parsedResult.error ? [null, parsedResult.error] : [parsedResult.data, null];
  };

  const getBudget: AdditionalFuncs<TTransaction[]>['getBudget'] = async (startDate, endDate) => {
    if (!process.env.POCKETBASE_URL) return [null, new Error('Pocketbase URL not set')];

    const query = new URLSearchParams({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }).toString();
    const response = await fetch(`${process.env.POCKETBASE_URL}/transactions/budget?${query}`, {
      ...preparePockebaseRequestOptions(),
    });
    const json = await response.json();

    const parsedResult = ZTransactionBudget.safeParse(json);
    return parsedResult.error ? [null, parsedResult.error] : [parsedResult.data, null];
  };

  return {
    data: getData(),
    getLatestTransactions,
    getPaidExpenses,
    getReceivedIncome,
    getUpcomingAsTransactions,
    getUpcoming,
    refreshData,
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
