import type { ServiceResponse } from "@budgetbuddyde/types";
import type { OdataConfig, OdataQuery } from "@tklein1801/o.js";
import { z } from "zod";
import {
	StockExchangesWithCount,
	StockExchangeVH,
	type TStockExchangesWithCount,
	type TStockExchangeVH,
} from "@/types";
import { EntityService } from "../Entity.service";

export class StockExchangeService extends EntityService {
	static {
		StockExchangeService.$servicePath = "/odata/v4/asset";
		StockExchangeService.entity = "StockExchange";
	}

	static async getWithCount(
		query?: Omit<OdataQuery, "$count" | "$expand">,
		config?: Partial<Omit<OdataConfig, "fragment">>,
	): Promise<ServiceResponse<TStockExchangesWithCount>> {
		try {
			const records = await StockExchangeService.newOdataHandler({
				...config,
				fragment: undefined,
			})
				.get(StockExchangeService.$entityPath)
				.query({
					...query,
					$count: true,
				});
			StockExchangeService.logger.debug("Fetched stock exchanges:", records);
			const parsingResult = StockExchangesWithCount.safeParse(records);
			if (!parsingResult.success) {
				return StockExchangeService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return StockExchangeService.handleError(e);
		}
	}

	static async getValueHelps(
		query?: OdataQuery,
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TStockExchangeVH[]>> {
		try {
			const records = await StockExchangeService.newOdataHandler(config)
				.get(`${StockExchangeService.$servicePath}/StockExchange_VH`)
				.query(query);
			const parsingResult = z.array(StockExchangeVH).safeParse(records);
			if (!parsingResult.success) {
				return StockExchangeService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return StockExchangeService.handleError(e);
		}
	}

	static async delete(): Promise<ServiceResponse<true>> {
		return [null, new Error("Stock exchanges cannot be deleted.")];
	}
}
