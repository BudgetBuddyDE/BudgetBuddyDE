import {z} from 'zod';
import {ZBaseModel, ZId, ZNullableString} from './PocketBase.types';
import {ZDate} from './Base.type';

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
      marked_for_deletion: ZDate.nullable(),
      newsletter: z.array(ZId),
    }).shape,
  })
  .nullable();
export type TUser = z.infer<typeof ZUser>;
