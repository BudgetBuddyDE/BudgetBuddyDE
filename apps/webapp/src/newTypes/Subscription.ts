import {z} from 'zod';

import {Transaction} from './Transaction';
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

// Response from OData
export const SubscriptionResponse = Subscription.extend(ODataContextAspect.shape);
export type TSubscriptionResponse = z.infer<typeof SubscriptionResponse>;
