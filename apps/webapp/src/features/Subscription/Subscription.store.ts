import {GenerateGenericStore} from '@/hooks/GenericHook';
import {type TSubscription} from '@/newTypes';

import {SubscriptionService} from './SubscriptionService/Subscription.service';

export const useSubscriptionStore = GenerateGenericStore<TSubscription[]>(async () => {
  const subscriptions = await SubscriptionService.getSubscriptions();
  // FIXME: return SubscriptionService.sortByExecutionDate(subscriptions);
  return subscriptions;
});
