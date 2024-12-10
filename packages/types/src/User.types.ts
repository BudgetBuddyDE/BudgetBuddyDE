import {z} from 'zod';
import {ZBaseModel, ZId, ZNullableString} from './PocketBase.types';

export const ZUser = z
  .object({
    ...ZBaseModel.shape,
    ...z.object({
      avatar: ZNullableString,
      email: z.string().email(),
      emailVisibility: z.boolean(),
      username: z.string(),
      name: ZNullableString,
      surname: ZNullableString,
      verified: z.boolean(),
      marked_for_deletion: z
        .date()
        .or(z.number())
        .or(z.string())
        .transform(val => (typeof val === 'string' && val.length === 0 ? null : new Date(val)))
        .nullable(),
      newsletter: z.array(ZId),
    }).shape,
  })
  .nullable();
export type TUser = z.infer<typeof ZUser>;
