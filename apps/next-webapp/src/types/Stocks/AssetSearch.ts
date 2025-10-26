import { AssetType, ISIN } from "@budgetbuddyde/types";
import { z } from "zod";

export const SearchAsset = z.object({
	isin: ISIN.or(z.string()), // REVISIT: Implement better support for commodities and cryptos without ISIN
	name: z.string(),
	logoUrl: z.url(),
	assetType: AssetType,
});
export type TSearchAsset = z.infer<typeof SearchAsset>;
