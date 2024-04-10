import {z} from 'zod';
import {ZDescription, ZCreatedAt} from '../Base.type';

export const ZRole = z.object({
  id: z.number(),
  name: z.string(),
  description: ZDescription,
  permissions: z.number(),
  createdAt: ZCreatedAt,
});

export type TRole = z.infer<typeof ZRole>;
