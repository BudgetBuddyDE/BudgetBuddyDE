import {z} from 'zod';
import {ZRole} from './Role.type';
import {ZCreatedAt, ZEmail} from '../index';

export const ZUser = z.object({
  uuid: z.string().uuid(),
  isVerified: z.boolean().default(false),
  role: ZRole,
  email: ZEmail,
  name: z.string(),
  surname: z.string(),
  password: z.string(),
  createdAt: ZCreatedAt,
});
export type TUser = z.infer<typeof ZUser>;

export const ZUpdateUserPayload = z.object({
  uuid: z.string().uuid(),
  email: ZEmail,
  name: z.string(),
  surname: z.string(),
});
export type TUpdateUserPayload = z.infer<typeof ZUpdateUserPayload>;
