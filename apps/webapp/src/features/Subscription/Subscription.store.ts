import {type TSubscription} from '@budgetbuddyde/types';

import {GenerateGenericStore} from '@/hooks/GenericHook';

import {SubscriptionService} from './SubscriptionService/Subscription.service';

export const useSubscriptionStore = GenerateGenericStore<TSubscription[]>(async () => {
  const subscriptions = await SubscriptionService.getSubscriptions();
  return SubscriptionService.sortByExecutionDate(subscriptions);
});
