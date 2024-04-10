import {z} from 'zod';
import {ZUser} from './User.type';
import {ZCreatedAt, ZDescription} from '../Base.type';

const ZName = z.string().max(100, {message: 'Name is too long'});
const ZAddress = z.string().max(100, {message: 'Address is too long'});
const ZProvider = z.string().max(100, {message: 'Provider is too long'});

export const ZPaymentMethod = z.object({
  id: z.number(),
  owner: ZUser,
  name: ZName,
  address: ZAddress,
  provider: ZProvider,
  description: ZDescription,
  createdAt: ZCreatedAt,
});
export type TPaymentMethod = z.infer<typeof ZPaymentMethod>;

export const ZCreatePaymentMethodPayload = z.object({
  owner: z.string().uuid(),
  name: ZName,
  address: ZAddress,
  provider: ZProvider,
  description: ZDescription,
});
export type TCreatePaymentMethodPayload = z.infer<typeof ZCreatePaymentMethodPayload>;

export const ZUpdatePaymentMethodPayload = z.object({
  id: z.number(),
  name: ZName,
  address: ZAddress,
  provider: ZProvider,
  description: ZDescription,
});
export type TUpdatePaymentMethodPayload = z.infer<typeof ZUpdatePaymentMethodPayload>;

export const ZDeletePaymentMethodPayload = z.array(
  z.object({
    paymentMethodId: z.number(),
  }),
);
export type TDeletePaymentMethodPayload = z.infer<typeof ZDeletePaymentMethodPayload>;
export const ZDeletePaymentMethodResponsePayload = z.object({
  success: z.array(ZPaymentMethod),
  failed: ZDeletePaymentMethodPayload,
});
export type TDeletePaymentMethodResponsePayload = z.infer<typeof ZDeletePaymentMethodResponsePayload>;
