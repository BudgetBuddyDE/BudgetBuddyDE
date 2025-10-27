/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import type { ServiceResponse } from "@budgetbuddyde/types";
import type { OdataConfig, OdataQuery } from "@tklein1801/o.js";
import { z } from "zod";
import {
	BudgetResponse,
	ExpandedBudget,
	ExpandedBudgetsWithCount,
	type TBudgetResponse,
	type TCreateOrUpdateBudget,
	type TExpandedBudget,
	type TExpandedBudgetsWithCount,
} from "@/types";
import { EntityService } from "./Entity.service";

export class BudgetService extends EntityService {
	private static $defaultQuery: OdataQuery = {
		$expand: "toCategories($expand=toCategory)",
	};

	static {
		this.entity = "Budget";
	}

	/**
	 * Creates a new budget.
	 * @param payload The budget data to create.
	 * @returns A promise that resolves to the created budget or an error.
	 */
	static async create(
		payload: TCreateOrUpdateBudget,
	): Promise<ServiceResponse<TExpandedBudget>> {
		try {
			const record = await this.newOdataHandler()
				.post(this.$entityPath, payload)
				.query(this.$defaultQuery);
			const parsingResult = ExpandedBudget.safeParse(record);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}

	/**
	 * Updates an existing budget.
	 * @param entityId The ID of the budget to update.
	 * @param payload The updated budget data.
	 * @returns A promise that resolves to the updated budget or an error.
	 */
	static async update(
		entityId: string,
		payload: TCreateOrUpdateBudget,
	): Promise<ServiceResponse<TBudgetResponse>> {
		try {
			const record = await this.newOdataHandler()
				.patch(`${this.$entityPath}(ID=${entityId})`, payload)
				.query();
			const parsingResult = BudgetResponse.safeParse(record);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}

	/**
	 * Retrieves the list of budgets from the database.
	 * @returns A promise that resolves to an array of TExpandedBudget objects.
	 * @throws If there is an error parsing the retrieved records.
	 */
	static async get(
		query?: OdataQuery,
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TExpandedBudget[]>> {
		try {
			const records = await this.newOdataHandler(config)
				.get(this.$entityPath)
				.query({
					...this.$defaultQuery,
					...query,
				});
			const parsingResult = z.array(ExpandedBudget).safeParse(records);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}

	/**
	 * Retrieves the list of budgets from the database with a count of total budgets.
	 * @param query - The OData query parameters.
	 * @param config - The OData configuration options.
	 * @returns A promise that resolves to a ServiceResponse containing the budgets and their count.
	 */
	static async getWithCount(
		query?: Omit<OdataQuery, "$count">,
		config?: Partial<Omit<OdataConfig, "fragment">>,
	): Promise<ServiceResponse<TExpandedBudgetsWithCount>> {
		try {
			const records = await this.newOdataHandler({
				...config,
				fragment: undefined,
			})
				.get(this.$entityPath)
				.query({
					...this.$defaultQuery,
					$count: true,
					...query,
				});
			const parsingResult = ExpandedBudgetsWithCount.safeParse(records);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}
}
