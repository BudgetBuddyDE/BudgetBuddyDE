import {z} from 'zod';
import {ZDate} from './Base.type';
import {ZBaseModel, ZId, ZNullableString} from './PocketBase.types';
import {ZCategory} from './Category.types';
import {ZPaymentMethod} from './PaymentMethod.types';

export const ZTransaction = z.object({
  ...ZBaseModel.shape,
  ...z.object({
    owner: ZId,
    category: ZId,
    payment_method: ZId,
    processed_at: ZDate,
    receiver: z.string(),
    information: ZNullableString,
    transfer_amount: z.number(),
    attachments: z.array(z.string()).optional(),
    expand: z.object({
      category: ZCategory,
      payment_method: ZPaymentMethod,
    }),
  }).shape,
});
export type TTransaction = z.infer<typeof ZTransaction>;

export const ZCreateTransactionPayload = z.object({
  owner: ZId,
  category: ZId,
  payment_method: ZId,
  processed_at: ZDate,
  receiver: z.string(),
  information: ZNullableString,
  transfer_amount: z.number(),
  attachments: z.array(z.string()).optional(),
});
export type TCreateTransactionPayload = z.infer<typeof ZCreateTransactionPayload>;

export const ZUpdateTransactionPayload = z.object({
  owner: ZId,
  category: ZId,
  payment_method: ZId,
  processed_at: ZDate,
  receiver: z.string(),
  information: ZNullableString,
  transfer_amount: z.number(),
  attachments: z.array(z.string()).optional(),
});
export type TUpdateTransactionPayload = z.infer<typeof ZUpdateTransactionPayload>;
