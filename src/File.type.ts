import {z} from 'zod';

export const ZFile = z.object({
  name: z.string(),
  size: z.number(),
  location: z.string(),
  type: z.string(),
  last_edited_at: z
    .date()
    .or(z.string())
    .transform(val => new Date(val)),
  created_at: z
    .date()
    .or(z.string())
    .transform(val => new Date(val)),
});
export type TFile = z.infer<typeof ZFile>;
