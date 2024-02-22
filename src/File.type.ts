import {z} from 'zod';
import {ZCreatedAt, ZDate} from './Base.type';

export const ZFile = z.object({
  name: z.string(),
  size: z.number(),
  location: z.string(),
  type: z.string(),
  last_edited_at: ZDate,
  created_at: ZCreatedAt,
});
export type TFile = z.infer<typeof ZFile>;
