import {type TPaymentMethod} from '@budgetbuddyde/types';

import {type TGenericHook} from '@/hooks/GenericHook';

import {usePaymentMethodStore} from './PaymentMethod.store';

export function usePaymentMethods(): TGenericHook<TPaymentMethod[]> {
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    usePaymentMethodStore();

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
