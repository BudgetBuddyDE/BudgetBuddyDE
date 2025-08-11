import { z } from 'zod';

import { ExpandedTransasction, Transaction } from './Transaction';
import { CdsDate, OptionalIdAspect } from './_Aspects';
import { ODataContextAspect, ODataCountAspect } from './_Base';

// Base model
export const Subscription = Transaction.omit({
  processedAt: true,
}).merge(
  z.object({
    paused: z.boolean().default(false),
    executeAt: z.number().int().min(1).max(31).default(1),
    nextExecution: CdsDate,
  })
);
export type TSubscription = z.infer<typeof Subscription>;

export const ExpandedSubscription = ExpandedTransasction.omit({
  processedAt: true,
}).merge(
  z.object({
    paused: z.boolean().default(false),
    executeAt: z.number().int().min(1).max(31).default(1),
    nextExecution: CdsDate,
  })
);
export type TExpandedSubscription = z.infer<typeof ExpandedSubscription>;

export const CreateOrUpdateSubscription = Subscription.pick({
  executeAt: true,
  paused: true,
  toCategory_ID: true,
  toPaymentMethod_ID: true,
  receiver: true,
  transferAmount: true,
  information: true,
}).merge(OptionalIdAspect);
export type TCreateOrUpdateSubscription = Partial<z.infer<typeof CreateOrUpdateSubscription>>;

// Response from OData
export const SubscriptionResponse = Subscription.extend(ODataContextAspect.shape);
export type TSubscriptionResponse = z.infer<typeof SubscriptionResponse>;

/**
 * Subscription with Count
 */
export const ExpandedSubscriptionsWithCount = z.object({
  ...ODataContextAspect.shape,
  ...ODataCountAspect.shape,
  value: z.array(ExpandedSubscription),
});
/**
 * Subscriptions with Count
 */
export type TExpandedSubscriptionsWithCount = z.infer<typeof ExpandedSubscriptionsWithCount>;
