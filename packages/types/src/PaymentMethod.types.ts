import {z} from 'zod';
import {ZBaseModel, ZId, ZNullableString} from './PocketBase.types';

export const ZPaymentMethod = z.object({
  ...ZBaseModel.shape,
  ...z.object({
    owner: ZId,
    name: z.string(),
    provider: z.string(),
    address: z.string(),
    description: ZNullableString,
  }).shape,
});
export type TPaymentMethod = z.infer<typeof ZPaymentMethod>;

export const ZCreatePaymentMethodPayload = z.object({
  owner: ZId,
  name: z.string(),
  provider: z.string(),
  address: z.string(),
  description: ZNullableString,
});
export type TCreatePaymentMethodPayload = z.infer<typeof ZCreatePaymentMethodPayload>;

export const ZUpdatePaymentMethodPayload = z.object({
  owner: ZId,
  name: z.string(),
  provider: z.string(),
  address: z.string(),
  description: ZNullableString,
});
export type TUpdatePaymentMethodPayload = z.infer<typeof ZUpdatePaymentMethodPayload>;
