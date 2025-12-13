/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import type { ServiceResponse } from "@budgetbuddyde/types";
import { z } from "zod";
import {
	ApiResponse,
	Budget,
	EstimatedBudget,
	type TCreateOrUpdateBudget,
	type TEstimatedBudget,
} from "@/types";
import { NewEntityService } from "./Entity.service";

const GetAllBudget = ApiResponse.extend({
	data: z.array(Budget),
});
const GetBudget = ApiResponse.extend({
	data: Budget.nullable(),
});
const PostBudget = ApiResponse.extend({
	data: z.array(
		Budget.pick({
			type: true,
			name: true,
			ownerId: true,
			budget: true,
			description: true,
		}),
	),
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
