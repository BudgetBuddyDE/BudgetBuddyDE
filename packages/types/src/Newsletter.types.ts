import {z} from 'zod';
import {ZId} from './PocketBase.types';
import {ZDate} from './Base.type';

export const ZNewsletter = z.object({
  id: ZId,
  enabled: z.boolean(),
  newsletter: z.string(),
  name: z.string(),
  description: z.string().nullable().default(null),
  created: ZDate,
  updated: ZDate,
});
export type TNewsletter = z.infer<typeof ZNewsletter>;
