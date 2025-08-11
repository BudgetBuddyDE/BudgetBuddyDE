import { TransactionService } from '@/services/Transaction.service';
import { createEntitySlice } from '../createEntitySlice';
import { SubscriptionService } from '@/services/Subscription.service';

export const subscriptionSlice = createEntitySlice('subscription', (query) =>
  SubscriptionService.getSubscriptionsWithCount(query)
);
