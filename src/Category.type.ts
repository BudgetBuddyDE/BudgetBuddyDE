import {z} from 'zod';
import {ZUser} from './User.type';
import {ZCreatedAt, ZDescription} from './Base.type';

const ZName = z.string().max(100, {message: 'Name is too long'});

export const ZCategory = z.object({
  id: z.number(),
  owner: ZUser,
  name: ZName,
  description: ZDescription,
  createdAt: ZCreatedAt,
});
export type TCategory = z.infer<typeof ZCategory>;

export const ZCreateCategoryPayload = z.object({
  owner: z.string().uuid(),
  name: ZName,
  description: ZDescription,
});
export type TCreateCategoryPayload = z.infer<typeof ZCreateCategoryPayload>;

export const ZUpdateCategoryPayload = z.object({
  categoryId: z.number(),
  name: ZName,
  description: ZDescription,
});
export type TUpdateCategoryPayload = z.infer<typeof ZUpdateCategoryPayload>;

export const ZDeleteCategoryPayload = z.array(
  z.object({
    categoryId: z.number(),
  }),
);
export type TDeleteCategoryPayload = z.infer<typeof ZDeleteCategoryPayload>;
export const ZDeleteCategoryResponsePayload = z.object({
  success: z.array(ZCategory),
  failed: ZDeleteCategoryPayload,
});
export type TDeleteCategoryResponsePayload = z.infer<typeof ZDeleteCategoryResponsePayload>;
