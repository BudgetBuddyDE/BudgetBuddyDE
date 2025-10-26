import type { ISIN, ServiceResponse } from "@budgetbuddyde/types";
import type { OdataConfig } from "@tklein1801/o.js";
import { z } from "zod";
import { Dividend, type TDividend } from "@/types/Stocks/Dividend";
import { EntityService } from "../Entity.service";

export class DividendService extends EntityService {
	static {
		DividendService.$servicePath = "/odata/v4/asset";
		DividendService.entity = "Dividend";
	}

	static async get(
		query?: Partial<{
			identifier: z.infer<typeof ISIN>[];
			future: boolean;
			historical: boolean;
		}>,
		config?: Partial<Omit<OdataConfig, "fragment">>,
	): Promise<ServiceResponse<TDividend[]>> {
		try {
			const searchQuery = new URLSearchParams();
			if (query?.future) {
				searchQuery.append("future", "true");
			}
			if (query?.historical) {
				searchQuery.append("historical", "true");
			}
			if (query?.identifier) {
				for (const isin of query.identifier) {
					searchQuery.append("identifier", isin);
				}
			}

			const records = await DividendService.newOdataHandler({
				...config,
				fragment: undefined,
			})
				.get(`${DividendService.$entityPath}?${searchQuery.toString()}`)
				.query();
			DividendService.logger.debug("Fetched dividends:", records);
			const parsingResult = z.array(Dividend).safeParse(records.value);
			if (!parsingResult.success) {
				return DividendService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return DividendService.handleError(e);
		}
	}

	static async delete(): Promise<ServiceResponse<true>> {
		return [null, new Error("Dividends cannot be deleted.")];
	}
}
