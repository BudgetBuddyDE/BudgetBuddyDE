import {z} from 'zod';

import {Transaction} from './Transaction';
import {OptionalIdAspect} from './_Aspects';
import {ODataContextAspect} from './_Base';

// Base model
export const Subscription = Transaction.omit({
  processedAt: true,
}).merge(
  z.object({
    paused: z.boolean().default(false),
    executeAt: z.number().int().min(1).max(31).default(1),
  }),
);
export type TSubscription = z.infer<typeof Subscription>;

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
