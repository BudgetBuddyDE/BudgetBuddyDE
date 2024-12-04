import {z} from 'zod';
import {ZBaseModel, ZId, ZNullableString} from './PocketBase.types';

export const ZCategory = z.object({
  ...ZBaseModel.shape,
  ...z.object({
    owner: ZId,
    name: z.string(),
    description: ZNullableString,
  }).shape,
});
export type TCategory = z.infer<typeof ZCategory>;

export const ZCreateCategoryPayload = z.object({
  owner: ZId,
  name: z.string(),
  description: ZNullableString,
});
export type TCreateCategoryPayload = z.infer<typeof ZCreateCategoryPayload>;

export const ZUpdateCategoryPayload = z.object({
  owner: ZId,
  name: z.string(),
  description: ZNullableString,
});
export type TUpdateCategoryPayload = z.infer<typeof ZUpdateCategoryPayload>;
