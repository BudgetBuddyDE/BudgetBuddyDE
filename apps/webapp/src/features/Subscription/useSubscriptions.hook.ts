import {type TGenericHook} from '@/hooks/GenericHook';
import {type TSubscription} from '@/newTypes';

import {useSubscriptionStore} from './Subscription.store';
import {SubscriptionService} from './SubscriptionService';

interface IAdditionalFunctions<T> {
  getUpcomingSubscriptions: (count: number, offset?: number) => T;
  getUpcomingSubscriptionPaymentsByCategory: () => ReturnType<
    typeof SubscriptionService.getUpcomingSubscriptionPaymentsByCategory
  >;
  getUpcoming: (type: 'EXPENSES' | 'INCOME') => number;
}

export function useSubscriptions(): TGenericHook<TSubscription[], IAdditionalFunctions<TSubscription[]>> {
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    useSubscriptionStore();

  const getUpcomingSubscriptions: IAdditionalFunctions<TSubscription[]>['getUpcomingSubscriptions'] = (
    _count,
    _offset,
  ) => {
    // FIXME: return SubscriptionService.getUpcomingSubscriptions(getData() ?? [], count, offset);
    return getData()!;
  };

  const getUpcomingSubscriptionPaymentsByCategory: IAdditionalFunctions<
    TSubscription[]
  >['getUpcomingSubscriptionPaymentsByCategory'] = () => {
    // FIXME: return SubscriptionService.getUpcomingSubscriptionPaymentsByCategory(getData() ?? []);
    return new Map();
  };

  const getUpcoming: IAdditionalFunctions<TSubscription[]>['getUpcoming'] = (type): number => {
    const today = new Date().getDate();
    const subscriptions = getData() ?? [];
    const acc: number = subscriptions
      .filter(
        s =>
          !s.paused &&
          ((type === 'EXPENSES' && s.transferAmount < 0) || (type === 'INCOME' && s.transferAmount > 0)) &&
          today < s.executeAt,
      )
      .reduce((prev, curr) => prev + Math.abs(curr.transferAmount), 0);
    return acc;
  };

  return {
    data: getData(),
    getUpcomingSubscriptions,
    getUpcomingSubscriptionPaymentsByCategory,
    getUpcoming,
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
