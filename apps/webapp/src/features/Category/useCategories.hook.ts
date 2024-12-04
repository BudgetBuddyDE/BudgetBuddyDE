import {type TCategory, type TServiceResponse} from '@budgetbuddyde/types';
import {format} from 'date-fns';

import {type TGenericHook} from '@/hooks/GenericHook';
import {preparePockebaseRequestOptions} from '@/utils';

import {useCategoryStore} from './Category.store';
import {type TCategoryStats, ZCategoryStats} from './Category.types';

interface AdditionalFuncs {
  getStats: (startDate: Date, endDate: Date) => Promise<TServiceResponse<TCategoryStats>>;
}

export function useCategories(): TGenericHook<TCategory[], AdditionalFuncs> {
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    useCategoryStore();

  const getStats: AdditionalFuncs['getStats'] = async (startDate, endDate) => {
    if (!process.env.POCKETBASE_URL) return [null, new Error('Pocketbase URL not set')];

    const query = new URLSearchParams({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }).toString();
    const response = await fetch(`${process.env.POCKETBASE_URL}/cateogries/stats?${query}`, {
      ...preparePockebaseRequestOptions(),
    });
    const json = await response.json();

    const parsedResult = ZCategoryStats.safeParse(json);
    return parsedResult.error ? [null, parsedResult.error] : [parsedResult.data, null];
  };

  return {
    data: getData(),
    refreshData,
    getStats,
    isLoading,
    isFetched,
    fetchedAt,
    fetchedBy,
    hasError,
    error,
    resetStore,
  };
}
