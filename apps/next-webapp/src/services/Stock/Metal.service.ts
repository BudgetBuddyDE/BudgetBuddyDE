import type { ServiceResponse } from "@budgetbuddyde/types";
import type { OdataConfig, OdataQuery } from "@tklein1801/o.js";
import { z } from "zod";
import {
	Metal,
	MetalQuote,
	type TMetal,
	type TMetalQuote,
} from "@/types/Stocks/Metal";
import { EntityService } from "../Entity.service";

export class MetalService extends EntityService {
	static {
		MetalService.$servicePath = "/odata/v4/asset";
		MetalService.entity = "Metal";
	}

	static async getList(
		query?: Omit<OdataQuery, "$count" | "$expand">,
		config?: Partial<Omit<OdataConfig, "fragment">>,
	): Promise<ServiceResponse<TMetal[]>> {
		try {
			const records = await MetalService.newOdataHandler({
				...config,
				fragment: undefined,
			})
				.get(MetalService.$entityPath)
				.query(query);
			const parsingResult = z.array(Metal).safeParse(records.value);
			if (!parsingResult.success) {
				return MetalService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return MetalService.handleError(e);
		}
	}

	static async getListWithQuotes(
		query?: Omit<OdataQuery, "$count" | "$expand">,
		config?: Partial<Omit<OdataConfig, "fragment">>,
	): Promise<ServiceResponse<TMetalQuote[]>> {
		try {
			const records = await MetalService.newOdataHandler({
				...config,
				fragment: undefined,
			})
				.get(`${MetalService.$servicePath}/MetalQuote`)
				.query(query);
			const parsingResult = z.array(MetalQuote).safeParse(records.value);
			if (!parsingResult.success) {
				return MetalService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return MetalService.handleError(e);
		}
	}
}
