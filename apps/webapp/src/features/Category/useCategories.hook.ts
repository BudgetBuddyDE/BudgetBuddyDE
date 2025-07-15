import {type TServiceResponse} from '@budgetbuddyde/types';

import {type TGenericHook} from '@/hooks/GenericHook';
import {type TCategory, type TCategory_VH} from '@/newTypes';

import {useCategoryStore} from './Category.store';
import {type TCategoryStats} from './Category.types';

interface AdditionalFuncs {
  getStats: (startDate: Date, endDate: Date) => Promise<TServiceResponse<TCategoryStats>>;
  // getValueHelps: () => Promise<TCategory_VH[]>;
  getValueHelps: () => TCategory_VH[];
}

export function useCategories(): TGenericHook<TCategory[], AdditionalFuncs> {
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    useCategoryStore();

  /**
   * @deprecated
   */
  const getStats: AdditionalFuncs['getStats'] = async (_startDate, _endDate) => {
    //   const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_HOST;
    //   if (!POCKETBASE_URL) return [null, new Error('Pocketbase URL not set')];

    //   const query = new URLSearchParams({
    //     startDate: format(startDate, 'yyyy-MM-dd'),
    //     endDate: format(endDate, 'yyyy-MM-dd'),
    //   }).toString();
    //   const response = await fetch(`${POCKETBASE_URL}/cateogries/stats?${query}`, {
    //     ...preparePockebaseRequestOptions(),
    //   });
    //   const json = await response.json();

    //   const parsedResult = ZCategoryStats.safeParse(json);
    //   return parsedResult.error ? [null, parsedResult.error] : [parsedResult.data, null];
    return [null, new Error('getStats is deprecated and not implemented')];
  };

  const getValueHelps = () => {
    const categories = getData();
    if (!categories) return [];
    return categories.map(category => ({
      ID: category.ID,
      name: category.name,
      description: category.description,
    }));
  };

  return {
    data: getData(),
    getValueHelps,
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
