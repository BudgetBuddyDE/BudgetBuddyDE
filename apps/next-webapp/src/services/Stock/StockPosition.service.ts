import {
	type AssetIdentifier,
	BackendSchemas,
	type ServiceResponse,
	type Timeframe,
} from "@budgetbuddyde/types";
import type { OdataConfig, OdataQuery } from "@tklein1801/o.js";
import z from "zod";
import {
	RelatedAsset,
	SearchAsset,
	StockPosition,
	StockPositionAllocation,
	StockPositionsKPI,
	StockPositionsWithCount,
	type TCreateOrUpdateStockPosition,
	type TRelatedAsset,
	type TSearchAsset,
	type TStockPosition,
	type TStockPositionAllocation,
	type TStockPositionsKPI,
	type TStockPositionsWithCount,
} from "@/types";
import { EntityService } from "../Entity.service";

export class StockPositionService extends EntityService {
	private static $defaultQuery: OdataQuery = {
		$expand: "toExchange",
	};

	static {
		StockPositionService.$servicePath = "/odata/v4/asset";
		StockPositionService.entity = "StockPosition";
	}

	static async create(
		payload: TCreateOrUpdateStockPosition,
	): Promise<ServiceResponse<unknown>> {
		try {
			const record = await StockPositionService.newOdataHandler()
				.post(StockPositionService.$entityPath, payload)
				.query();
			const parsingResult = StockPosition.omit({
				logoUrl: true,
				securityName: true,
				assetType: true,
				currentPrice: true,
				positionValue: true,
				absoluteProfit: true,
				relativeProfit: true,
			}).safeParse(record);
			if (!parsingResult.success) {
				return StockPositionService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return StockPositionService.handleError(e);
		}
	}

	static async update(
		entityId: string,
		payload: TCreateOrUpdateStockPosition,
	): Promise<ServiceResponse<TStockPosition>> {
		try {
			const record = await StockPositionService.newOdataHandler()
				.patch(`${StockPositionService.$entityPath}(ID=${entityId})`, payload)
				.query();
			const parsingResult = StockPosition.safeParse(record);
			if (!parsingResult.success) {
				return StockPositionService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return StockPositionService.handleError(e);
		}
	}

	static async getWithCount(
		query?: Omit<OdataQuery, "$count" | "$expand">,
		config?: Partial<Omit<OdataConfig, "fragment">>,
	): Promise<ServiceResponse<TStockPositionsWithCount>> {
		try {
			const records = await StockPositionService.newOdataHandler({
				...config,
				fragment: undefined,
			})
				.get(StockPositionService.$entityPath)
				.query({
					...StockPositionService.$defaultQuery,
					...query,
					$count: true,
				});
			const parsingResult = StockPositionsWithCount.safeParse(records);
			if (!parsingResult.success) {
				return StockPositionService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return StockPositionService.handleError(e);
		}
	}

	// TODO: Move to AssetService.assets
	/**
	 * Search securities via Parqet using keywords
	 * @param query Search query
	 * @param config
	 * @returns
	 */
	static async search(
		query: string,
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TSearchAsset[]>> {
		try {
			const records = await StockPositionService.newOdataHandler(config)
				.get(`${StockPositionService.$servicePath}/SearchAsset`)
				.query({ $search: query });
			const parsingResult = z.array(SearchAsset).safeParse(records);
			if (!parsingResult.success) {
				return StockPositionService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return StockPositionService.handleError(e);
		}
	}

	static async getKPIs(
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TStockPositionsKPI>> {
		try {
			const records = await StockPositionService.newOdataHandler(config)
				.get(`${StockPositionService.$servicePath}/StockPositionsKPI`)
				.query();
			const parsingResult = StockPositionsKPI.safeParse(records);
			if (!parsingResult.success) {
				return StockPositionService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return StockPositionService.handleError(e);
		}
	}

	static async getPositionAllocations(
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TStockPositionAllocation[]>> {
		try {
			const records = await StockPositionService.newOdataHandler(config)
				.get(`${StockPositionService.$servicePath}/StockPositionAllocation`)
				.query();
			const parsingResult = z.array(StockPositionAllocation).safeParse(records);
			if (!parsingResult.success) {
				return StockPositionService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return StockPositionService.handleError(e);
		}
	}

	// TODO: Move to AssetService.assets
	static async getAssets(
		identifiers: z.infer<typeof AssetIdentifier>[],
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<z.infer<typeof BackendSchemas.Asset>[]>> {
		try {
			const query = new URLSearchParams();
			identifiers.forEach((id) => {
				query.append("identifier", id);
			});

			const records = await StockPositionService.newOdataHandler(config)
				.get(`${StockPositionService.$servicePath}/Asset?${query.toString()}`)
				.query();

			const parsingResult = z.array(BackendSchemas.Asset).safeParse(records);
			if (!parsingResult.success) {
				return StockPositionService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return StockPositionService.handleError(e);
		}
	}

	// TODO: Move to AssetService.assets
	static async getAsset(
		identifier: string,
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<z.infer<typeof BackendSchemas.Asset>>> {
		try {
			const query = new URLSearchParams();
			query.append("identifier", identifier);

			const records = await StockPositionService.newOdataHandler(config)
				.get(`${StockPositionService.$servicePath}/Asset?${query.toString()}`)
				.query();

			const parsingResult = BackendSchemas.Asset.safeParse(records[0]);
			if (!parsingResult.success) {
				return StockPositionService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return StockPositionService.handleError(e);
		}
	}

	static async getAssetQuotes(
		identifier: z.infer<typeof AssetIdentifier>,
		timeframe: z.infer<typeof Timeframe>,
		currency: string = "EUR",
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<z.infer<typeof BackendSchemas.AssetQuote>>> {
		try {
			const query = new URLSearchParams();
			query.append("identifier", identifier);
			query.append("timeframe", timeframe);
			query.append("currency", currency);

			const records = await StockPositionService.newOdataHandler(config)
				.get(
					`${StockPositionService.$servicePath}/AssetQuote?${query.toString()}`,
				)
				.query();

			const parsingResult = z
				.array(BackendSchemas.AssetQuote)
				.safeParse(records);
			if (!parsingResult.success) {
				return StockPositionService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data[0], null];
		} catch (e) {
			return StockPositionService.handleError(e);
		}
	}

	// TODO: Move to AssetService.assets
	static async getRelatedAssets(
		isin: string,
		includeQuotes: boolean = false,
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TRelatedAsset[]>> {
		try {
			const query = new URLSearchParams();
			query.set("identifier", isin);
			if (includeQuotes) {
				query.set("$expand", "quotes");
			}

			const records = await StockPositionService.newOdataHandler(config)
				.get(
					`${StockPositionService.$servicePath}/RelatedAsset?${query.toString()}`,
				)
				.query();

			const parsingResult = z.array(RelatedAsset).safeParse(records);
			if (!parsingResult.success) {
				return StockPositionService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return StockPositionService.handleError(e);
		}
	}
}
