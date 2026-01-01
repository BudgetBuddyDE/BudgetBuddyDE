import { BackendError, ResponseNotJsonError } from "../error";
import type {
	TCreateOrUpdateBudgetPayload,
	TEstimatedBudget,
} from "../types/budget.type";
import type { TResult } from "../types/common";
import {
	CreateBudgetResponse,
	DeleteBudgetResponse,
	EstimatedBudgetResponse,
	GetAllBudgetsResponse,
	GetBudgetResponse,
	UpdateBudgetResponse,
} from "../types/schemas/budget.schema";
import { EntityService } from "./entity.service";

export class BudgetService extends EntityService<
	TCreateOrUpdateBudgetPayload,
	Partial<TCreateOrUpdateBudgetPayload>,
	typeof GetAllBudgetsResponse,
	typeof GetBudgetResponse,
	typeof CreateBudgetResponse,
	typeof UpdateBudgetResponse,
	typeof DeleteBudgetResponse
> {
	constructor(host: string, entityPath = "/api/budget") {
		super(host, entityPath, {
			getAll: GetAllBudgetsResponse,
			get: GetBudgetResponse,
			create: CreateBudgetResponse,
			update: UpdateBudgetResponse,
			delete: DeleteBudgetResponse,
		});
	}

	async getEstimatedBudget(
		requestConfig?: RequestInit,
	): Promise<TResult<TEstimatedBudget>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/estimated`,
				this.mergeRequestConfig(
					{
						method: "GET",
						credentials: "include",
						headers: new Headers(requestConfig?.headers || {}),
					},
					requestConfig,
				),
			);
			if (!response.ok) {
				throw new BackendError(response.status, response.statusText);
			}
			if (!this.isJsonResponse(response)) {
				throw new ResponseNotJsonError();
			}
			const data = await response.json();

			const parsingResult = EstimatedBudgetResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data.data ?? [], null];
		} catch (error) {
			return this.handleError(error);
		}
	}
}
