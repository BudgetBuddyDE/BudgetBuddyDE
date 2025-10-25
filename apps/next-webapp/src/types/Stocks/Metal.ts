import { z } from 'zod';

export const Metal = z.object({
  symbol: z.string().min(1).max(3),
  name: z.string().optional(),
  unit: z.enum(['troy_oz', 'oz']),
});
export type TMetal = z.infer<typeof Metal>;

export const MetalQuote = Metal.extend({
  eur: z.number(),
  usd: z.number(),
});
export type TMetalQuote = z.infer<typeof MetalQuote>;
