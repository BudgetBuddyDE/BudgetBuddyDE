import type { ZodType, z } from "zod";
import { BackendError, ResponseNotJsonError } from "../error";
import type { TResult } from "../types/common";
import type { IBaseGetAllQuery } from "../types/interfaces/query.interface";

type TEntitySchemas<
	GetAll extends z.ZodType,
	Get extends z.ZodType,
	Create extends z.ZodType,
	Update extends z.ZodType,
	Delete extends z.ZodType,
> = {
	getAll: GetAll;
	get: Get;
	create: Create;
	update: Update;
	delete: Delete;
};

export class EntityService<
	CreatePayload,
	UpdatePayload,
	GetAllResult extends ZodType,
	GetResult extends ZodType,
	CreateResult extends ZodType,
	UpdateResult extends ZodType,
	DeleteResult extends ZodType,
> {
	protected host: string;
	protected basePath: string;
	protected schemas: TEntitySchemas<
		GetAllResult,
		GetResult,
		CreateResult,
		UpdateResult,
		DeleteResult
	>;

	constructor(
		host: string,
		basePath: string,
		schemas: TEntitySchemas<
			GetAllResult,
			GetResult,
			CreateResult,
			UpdateResult,
			DeleteResult
		>,
	) {
		this.host = host;
		this.basePath = basePath;
		this.schemas = schemas;
	}

	protected getBaseRequestPath() {
		return `${this.host}${this.basePath}`;
	}

	protected handleError<T>(e: unknown): TResult<T> {
		const msg = e instanceof Error ? e.message : String(e);
		return [null, e instanceof Error ? e : new Error(msg)];
	}

	protected handleZodError<T, S>(
		errors: z.ZodError<S>[] | z.ZodError<S>,
	): TResult<T> {
		const msg = Array.isArray(errors)
			? errors.map((e) => e.message).join(", ")
			: errors.message;
		console.error(`ZodError in ${this.constructor.name}: %s`, msg);
		return [null, new Error(msg)];
	}

	protected mergeRequestConfig(
		config1: RequestInit,
		config2?: RequestInit,
	): RequestInit {
		return {
			...config1,
			...config2,
			headers: new Headers({
				...(config1.headers instanceof Headers
					? Object.fromEntries(config1.headers)
					: config1.headers),
				...(config2?.headers instanceof Headers
					? Object.fromEntries(config2.headers)
					: config2?.headers),
			}),
		};
	}

	async getAll<Q extends IBaseGetAllQuery>(
		query?: Q,
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<GetAllResult>>> {
		try {
			const queryParams = new URLSearchParams();
			if (query !== undefined) {
				Object.entries(query).forEach(([key, value]) => {
					const isDate = value instanceof Date;
					queryParams.append(
						key,
						isDate
							? // en-CA format yields YYYY-MM-DD which is ISO 8601 compliant
								// new Intl.DateTimeFormat("en-CA").format(value)
								value.toLocaleDateString("en-CA")
							: String(value),
					);
				});
			}

			const response = await fetch(
				`${this.getBaseRequestPath()}?${queryParams.toString()}`,
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

			const parsingResult = this.schemas.getAll.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}

	async getById(
		entityId: string,
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<GetResult>>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/${entityId}`,
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

			const parsingResult = this.schemas.get.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}

	async create(
		payload: CreatePayload,
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<CreateResult>>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}`,
				this.mergeRequestConfig(
					{
						method: "POST",
						headers: new Headers(
							requestConfig?.headers || {
								"Content-Type": "application/json",
							},
						),
						credentials: "include",
						body: JSON.stringify(payload),
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

			const parsingResult = this.schemas.create.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}

	async updateById(
		entityId: string,
		payload: UpdatePayload,
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<UpdateResult>>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/${entityId}`,
				this.mergeRequestConfig(
					{
						method: "PUT",
						headers: new Headers(
							requestConfig?.headers || {
								"Content-Type": "application/json",
							},
						),
						credentials: "include",
						body: JSON.stringify(payload),
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

			const parsingResult = this.schemas.update.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}

	async deleteById(
		entityId: string,
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<DeleteResult>>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/${entityId}`,
				this.mergeRequestConfig(
					{
						method: "DELETE",
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

			const parsingResult = this.schemas.delete.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}

	/**
	 * Checks if the response has a JSON content type.
	 * This method does not verify that the actually content is valid JSON.
	 */
	protected isJsonResponse(response: Response): boolean {
		const contentType = response.headers.get("content-type");
		return contentType?.includes("application/json") || false;
	}
}
