import {type TGenericHook} from '@/hooks/GenericHook';

import {type TMetalQuote} from './Metal.service';
import {useMetalQuoteStore} from './MetalQuote.store';

export function useMetalQuotes(): TGenericHook<TMetalQuote[]> {
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    useMetalQuoteStore();

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
