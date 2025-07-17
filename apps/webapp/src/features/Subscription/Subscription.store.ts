import {GenerateGenericStore} from '@/hooks/GenericHook';
import {type TExpandedSubscription} from '@/newTypes';

import {SubscriptionService} from './SubscriptionService/Subscription.service';

export const useSubscriptionStore = GenerateGenericStore<TExpandedSubscription[]>(async () => {
  const subscriptions = await SubscriptionService.getSubscriptions();
  // FIXME: return SubscriptionService.sortByExecutionDate(subscriptions);
  return subscriptions;
});
