import { z } from "zod";

export const ISIN = z
	.string()
	.max(12, { message: "ISIN can only be 12 characters long" });
export const WKN = z
	.string()
	.max(6, { message: "WKN can only be 6 characters long" });
export const CryptoSymbol = z
	.string()
	.min(3, { error: "CryptoSymbol must be at least 3 characters long" })
	.max(6, { error: "CryptoSymbol can only be 6 characters long" });
export const AssetIdentifier = z.union([ISIN, CryptoSymbol, WKN, z.string()]);
export const AssetType = z.enum(["Security", "Commodity", "Crypto"]);
export const SecurityType = z.enum(["Aktie", "ETF", "Zertifikat"]);
export const Timeframe = z.enum([
	"1w",
	"1m",
	"3m",
	"6m",
	"ytd",
	"1y",
	"3y",
	"5y",
	"max",
]);
