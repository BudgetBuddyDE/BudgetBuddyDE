import { z } from 'zod';
import { ISIN } from './StockPosition';

export const SearchAsset = z.object({
  isin: ISIN,
  name: z.string(),
  logoUrl: z.url(),
  securityType: z.enum(['Security', 'Commodity']),
});
export type TSearchAsset = z.infer<typeof SearchAsset>;
