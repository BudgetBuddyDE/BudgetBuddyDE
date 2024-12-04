import {type TAssetWatchlistWithQuote} from '@budgetbuddyde/types';

import {type TGenericHook} from '@/hooks/GenericHook';

import {useStockWatchlistStore} from './StockWatchlist.store';

export function useStockWatchlist(): TGenericHook<TAssetWatchlistWithQuote[]> {
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    useStockWatchlistStore();

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
