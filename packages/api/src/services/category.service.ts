import z from "zod";
import { BackendError, ResponseNotJsonError } from "../error";
import type {
	TCategory,
	TCategoryStats,
	TCategoryVH,
	TCreateOrUpdateCategoryPayload,
} from "../types/category.type";
import type { TResult } from "../types/common";
import {
	CategoryStatsResponse,
	CategoryVH,
	CreateCategoryResponse,
	DeleteCategoryResponse,
	GetAllCategoriesResponse,
	GetCategoryResponse,
	MergeCategoriesResponse,
	UpdateCategoryResponse,
} from "../types/schemas/category.schema";
import { EntityService } from "./entity.service";

export class CategoryService extends EntityService<
	TCreateOrUpdateCategoryPayload,
	Partial<TCreateOrUpdateCategoryPayload>,
	typeof GetAllCategoriesResponse,
	typeof GetCategoryResponse,
	typeof CreateCategoryResponse,
	typeof UpdateCategoryResponse,
	typeof DeleteCategoryResponse
> {
	constructor(host: string, entityPath = "/api/category") {
		super(host, entityPath, {
			getAll: GetAllCategoriesResponse,
			get: GetCategoryResponse,
			create: CreateCategoryResponse,
			update: UpdateCategoryResponse,
			delete: DeleteCategoryResponse,
		});
	}

	async getValueHelp(
		requestConfig?: RequestInit,
	): Promise<TResult<TCategoryVH[]>> {
		const [categories, error] = await this.getAll(undefined, requestConfig);
		if (error) {
			this.handleError(error);
		}

		const valueHelpValues = z
			.array(CategoryVH)
			.safeParse(categories?.data ?? []);
		if (!valueHelpValues.success) {
			return this.handleZodError(valueHelpValues.error);
		}
		return [valueHelpValues.data, null];
	}

	/**
	 * Retrieves the statistics for categories within a specific date range.
	 * @param param0 - The start and end dates for the statistics.
	 * @returns A promise that resolves to an array of expanded category statistics.
	 */
	async getCategoryStats(
		{
			from,
			to,
		}: {
			from: Date;
			to: Date;
		},
		requestConfig?: RequestInit,
	): Promise<TResult<TCategoryStats>> {
		try {
			const query = new URLSearchParams();
			// en-CA format yields YYYY-MM-DD which is ISO 8601 compliant
			query.append("from", from.toLocaleDateString("en-CA"));
			query.append("to", to.toLocaleDateString("en-CA"));

			const response = await fetch(
				`${this.getBaseRequestPath()}/stats?${query.toString()}`,
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

			const parsingResult = CategoryStatsResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data.data ?? [], null];
		} catch (error) {
			return this.handleError(error);
		}
	}

	async merge(
		{
			source,
			target,
		}: {
			source: TCategory["id"][];
			target: TCategory["id"];
		},
		requestConfig?: RequestInit,
	): Promise<
		TResult<{
			source: Set<TCategory["id"]>;
			target: TCategory["id"];
		}>
	> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/merge`,
				this.mergeRequestConfig(
					{
						method: "POST",
						credentials: "include",
						headers: new Headers({
							"Content-Type": "application/json",
							...(requestConfig?.headers || {}),
						}),
						body: JSON.stringify({ source, target }),
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

			const parsingResult = MergeCategoriesResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}
}
