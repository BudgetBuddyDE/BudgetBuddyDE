import {type TGenericHook} from '@/hooks/GenericHook';
import {type TPaymentMethod, type TPaymentMethod_VH} from '@/newTypes';

import {usePaymentMethodStore} from './PaymentMethod.store';

interface AdditionalFuncs {
  // getValueHelps: () => Promise<TPaymentMethod_VH[]>;
  getValueHelps: () => TPaymentMethod_VH[];
}

export function usePaymentMethods(): TGenericHook<TPaymentMethod[], AdditionalFuncs> {
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    usePaymentMethodStore();

  const getValueHelps = (): TPaymentMethod_VH[] => {
    const paymentMethods = getData();
    if (!paymentMethods) return [];
    return paymentMethods.map(paymentMethod => ({
      ID: paymentMethod.ID,
      name: paymentMethod.name,
      address: paymentMethod.address,
      provider: paymentMethod.provider,
      description: paymentMethod.description,
    }));
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
