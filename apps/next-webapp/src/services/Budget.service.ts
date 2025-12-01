/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import type { ServiceResponse } from "@budgetbuddyde/types";
import type { OdataConfig, OdataQuery } from "@tklein1801/o.js";
import { z } from "zod";
import {
	ApiResponse,
	Budget,
	BudgetResponse,
	EstimatedBudget,
	ExpandedBudgetsWithCount,
	type TBudgetResponse,
	type TCreateOrUpdateBudget,
	type TEstimatedBudget,
	type TExpandedBudgetsWithCount,
} from "@/types";
import { EntityService, NewEntityService } from "./Entity.service";

const GetAllBudget = ApiResponse.extend({
	data: z.array(Budget).nullable(),
});
const GetBudget = ApiResponse.extend({
	data: Budget.nullable(),
});
const PostBudget = ApiResponse.extend({
	data: z
		.array(
			Budget.pick({
				type: true,
				name: true,
				ownerId: true,
				budget: true,
				description: true,
			}),
		)
		.nullable(),
});
const PutBudget = PostBudget;
const DeleteBudget = PostBudget;

export class _BudgetService extends NewEntityService<
	TCreateOrUpdateBudget,
	TCreateOrUpdateBudget,
	typeof GetAllBudget,
	typeof GetBudget,
	typeof PostBudget,
	typeof PutBudget,
	typeof DeleteBudget
> {
	constructor() {
		super("/api/budget", {
			getAll: GetAllBudget,
			get: GetBudget,
			create: PostBudget,
			update: PutBudget,
			delete: DeleteBudget,
		});
	}

	async getEstimatedBudget(
		requestConfig?: RequestInit,
	): Promise<ServiceResponse<TEstimatedBudget>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/estimated`,
				this.mergeRequestConfig(
					{
						method: "GET",
						credentials: "include",
						headers: this.enhanceHeadersWithRequestId(
							new Headers(requestConfig?.headers || {}),
						),
					},
					requestConfig,
				),
			);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch budget estimations: ${response.statusText}`,
				);
			}
			if (!this.isJsonResponse(response)) {
				throw new Error("Response is not JSON");
			}
			const data = await response.json();

			const parsingResult = ApiResponse.extend({
				data: EstimatedBudget,
			}).safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data.data ?? [], null];
		} catch (error) {
			return this.handleError(error);
		}
	}
}

const ExpandedBudget = Budget;
type TExpandedBudget = z.infer<typeof ExpandedBudget>;
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
