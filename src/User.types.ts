import {z} from 'zod';
import {ZBaseModel, ZNullableString} from './PocketBase.types';

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
    }).shape,
  })
  .nullable();
export type TUser = z.infer<typeof ZUser>;
