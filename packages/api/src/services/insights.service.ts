import { BackendError, ResponseNotJsonError } from "../error";
import type { TResult, TypeOfSchema } from "../types";
import type { IGetHistoricalBalanceQuery } from "../types/interfaces";
import {
	GetHistoricalBalanceResponse,
	GetHistoricalCategoryBalanceResponse,
} from "../types/schemas";
import { BackendService } from "./backend.service";

export class InsightsService extends BackendService {
	constructor(host: string) {
		super(host, "/api/insights");
	}

	async getHistoricalBalance<Query extends IGetHistoricalBalanceQuery>(
		query: Query,
		requestConfig?: RequestInit,
	): Promise<TResult<TypeOfSchema<typeof GetHistoricalBalanceResponse>>> {
		try {
			const stringifiedQuery =
				this.reqQueryObjToURLSearchParams(query).toString();
			const response = await fetch(
				`${this.getBaseRequestPath()}/balance?${stringifiedQuery}`,
				this.mergeRequestConfig(
					{
						method: "GET",
						headers: new Headers(requestConfig?.headers || {}),
						credentials: "include",
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

			const parsingResult = GetHistoricalBalanceResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}

	async getHistoricalCategoryBalance<Query extends IGetHistoricalBalanceQuery>(
		query: Query,
		requestConfig?: RequestInit,
	): Promise<
		TResult<TypeOfSchema<typeof GetHistoricalCategoryBalanceResponse>>
	> {
		try {
			const stringifiedQuery =
				this.reqQueryObjToURLSearchParams(query).toString();
			const response = await fetch(
				`${this.getBaseRequestPath()}/category-balance?${stringifiedQuery}`,
				this.mergeRequestConfig(
					{
						method: "GET",
						headers: new Headers(requestConfig?.headers || {}),
						credentials: "include",
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

			const parsingResult =
				GetHistoricalCategoryBalanceResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}
}
