import {type TSubscription} from '@budgetbuddyde/types';

import {type TGenericHook} from '@/hooks/GenericHook';

import {useSubscriptionStore} from './Subscription.store';
import {SubscriptionService} from './SubscriptionService';

interface AdditionalFuns<T> {
  getUpcomingSubscriptions: (count: number, offset?: number) => T;
  getUpcomingSubscriptionPaymentsByCategory: () => ReturnType<
    typeof SubscriptionService.getUpcomingSubscriptionPaymentsByCategory
  >;
  getUpcoming: (type: 'EXPENSES' | 'INCOME') => number;
}

export function useSubscriptions(): TGenericHook<TSubscription[], AdditionalFuns<TSubscription[]>> {
  const {getData, isLoading, isFetched, fetchedAt, fetchedBy, refreshData, hasError, error, resetStore} =
    useSubscriptionStore();

  const getUpcomingSubscriptions: AdditionalFuns<TSubscription[]>['getUpcomingSubscriptions'] = (count, offset) => {
    return SubscriptionService.getUpcomingSubscriptions(getData() ?? [], count, offset);
  };

  const getUpcomingSubscriptionPaymentsByCategory: AdditionalFuns<
    TSubscription[]
  >['getUpcomingSubscriptionPaymentsByCategory'] = () => {
    return SubscriptionService.getUpcomingSubscriptionPaymentsByCategory(getData() ?? []);
  };

  const getUpcoming: AdditionalFuns<TSubscription[]>['getUpcoming'] = (type): number => {
    const today = new Date().getDate();
    const subscriptions = getData() ?? [];
    const acc: number = subscriptions
      .filter(
        s =>
          !s.paused &&
          ((type === 'EXPENSES' && s.transfer_amount < 0) || (type === 'INCOME' && s.transfer_amount > 0)) &&
          today < s.execute_at,
      )
      .reduce((prev, curr) => prev + Math.abs(curr.transfer_amount), 0);
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
