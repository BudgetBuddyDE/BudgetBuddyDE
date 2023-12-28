import {z} from 'zod';
import {ZUser} from './User.type';
import {ZCategory} from './Category.type';
import {ZPaymentMethod} from './PaymentMethod.type';
import {ZCreatedAt, ZDescription} from './Base.type';

const ZExecuteAt = z
  .union([z.number(), z.date()])
  .refine(value => {
    if (typeof value === 'number') {
      return value >= 0 && value <= 31;
    } else if (value instanceof Date) {
      return value.getDate() >= 1 && value.getDate() <= 31;
    }
    return false;
  }, 'Execution-Day must be a number between 0 and 31 or a valid date')
  .transform(value => {
    if (typeof value === 'number') {
      return value;
    } else if (value instanceof Date) {
      return value.getDate();
    }
    return value;
  });

export const ZSubscription = z.object({
  id: z.number(),
  owner: ZUser,
  category: ZCategory,
  paymentMethod: ZPaymentMethod,
  paused: z.boolean(),
  executeAt: ZExecuteAt,
  receiver: z.string(),
  description: ZDescription,
  transferAmount: z.number(),
  createdAt: ZCreatedAt,
});
export type TSubscription = z.infer<typeof ZSubscription>;

export const ZCreateSubcriptionPayload = z.object({
  owner: z.string().uuid(),
  categoryId: z.number(),
  paymentMethodId: z.number(),
  paused: z.boolean(),
  executeAt: ZExecuteAt,
  receiver: z.string(),
  description: ZDescription,
  transferAmount: z.number(),
});
export type TCreateSubscriptionPayload = z.infer<typeof ZCreateSubcriptionPayload>;

export const ZUpdateSubscriptionPayload = z.object({
  subscriptionId: z.number(),
  categoryId: z.number(),
  paymentMethodId: z.number(),
  paused: z.boolean(),
  executeAt: ZExecuteAt,
  receiver: z.string(),
  description: ZDescription,
  transferAmount: z.number(),
});
export type TUpdateSubscriptionPayload = z.infer<typeof ZUpdateSubscriptionPayload>;

export const ZDeleteSubscriptionPayload = z.object({
  subscriptionId: z.number(),
});
export type TDeleteSubscriptionPayload = z.infer<typeof ZDeleteSubscriptionPayload>;
