import {z} from 'zod';
import {ZBaseModel, ZId, ZNullableString} from './PocketBase.types';
import {ZCategory} from './Category.types';
import {ZPaymentMethod} from './PaymentMethod.types';

export const ZSubscription = z.object({
  ...ZBaseModel.shape,
  ...z.object({
    owner: ZId,
    category: ZId,
    payment_method: ZId,
    paused: z.boolean(),
    execute_at: z.number().min(1).max(31),
    receiver: z.string(),
    transfer_amount: z.number(),
    information: ZNullableString,
    expand: z.object({
      category: ZCategory,
      payment_method: ZPaymentMethod,
    }),
  }).shape,
});
export type TSubscription = z.infer<typeof ZSubscription>;

export const ZCreateSubscriptionPayload = z.object({
  owner: ZId,
  category: ZId,
  payment_method: ZId,
  paused: z.boolean(),
  execute_at: z.number().min(1).max(31),
  receiver: z.string(),
  information: ZNullableString,
  transfer_amount: z.number(),
  attachments: z.array(z.string()).optional(),
});
export type TCreateSubscriptionPayload = z.infer<typeof ZCreateSubscriptionPayload>;

export const ZUpdateSubscriptionPayload = z.object({
  owner: ZId,
  category: ZId,
  payment_method: ZId,
  paused: z.boolean(),
  execute_at: z.number().min(1).max(31),
  receiver: z.string(),
  information: ZNullableString,
  transfer_amount: z.number(),
  attachments: z.array(z.string()).optional(),
});
export type TUpdateSubscriptionPayload = z.infer<typeof ZUpdateSubscriptionPayload>;
