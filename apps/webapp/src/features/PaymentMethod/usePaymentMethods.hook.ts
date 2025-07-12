import {type TGenericHook} from '@/hooks/GenericHook';
import {type TPaymentMethod, type TPaymentMethod_VH} from '@/newTypes';

import {usePaymentMethodStore} from './PaymentMethod.store';
import {PaymentMethodService} from './PaymentMethodService';

interface AdditionalFuncs {
  getValueHelps: () => Promise<TPaymentMethod_VH[]>;
}

export function usePaymentMethods(): TGenericHook<TPaymentMethod[], AdditionalFuncs> {
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    usePaymentMethodStore();

  const getValueHelps = async (): Promise<TPaymentMethod_VH[]> => {
    return PaymentMethodService.getPaymentMethodValueHelps();
  };

  return {
    data: getData(),
    refreshData,
    getValueHelps,
    isLoading,
    isFetched,
    fetchedAt,
    fetchedBy,
    hasError,
    error,
    resetStore,
  };
}
