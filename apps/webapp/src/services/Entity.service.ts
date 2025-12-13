/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */

import type { ServiceResponse } from "@budgetbuddyde/types";
import type { ZodType, z } from "zod";
import { logger } from "@/logger";
import { Formatter } from "@/utils/Formatter";

export type BaseGetAllQuery = {
	search?: string;
	from?: number;
	to?: number;
};

type EntitySchemas<
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

export class NewEntityService<
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
	protected schemas: EntitySchemas<
		GetAllResult,
		GetResult,
		CreateResult,
		UpdateResult,
		DeleteResult
	>;
	protected logger = logger.child({ label: this.constructor.name });

	constructor(
		basePath: string = "",
		schemas: EntitySchemas<
			GetAllResult,
			GetResult,
			CreateResult,
			UpdateResult,
			DeleteResult
		>,
	) {
		this.host =
			process.env.NEXT_PUBLIC_BACKEND_SERVICE_HOST || "http://localhost:9000";
		this.basePath = basePath;
		this.schemas = schemas;
	}

	protected getBaseRequestPath() {
		return `${this.host}${this.basePath}`;
	}

	protected enhanceHeadersWithRequestId(
		headers: Headers,
		requestId: string = this.createRequestId(),
	): Headers {
		headers.append("X-Request-ID".toLowerCase(), requestId);
		return headers;
	}

	protected createRequestId(): string {
		return crypto.randomUUID();
	}

	protected handleError<T>(e: unknown): ServiceResponse<T> {
		const msg = e instanceof Error ? e.message : String(e);
		return [null, e instanceof Error ? e : new Error(msg)];
	}

	protected handleZodError<T, S>(
		errors: z.ZodError<S>[] | z.ZodError<S>,
	): ServiceResponse<T> {
		const msg = Array.isArray(errors)
			? errors.map((e) => e.message).join(", ")
			: errors.message;
		logger.error(`ZodError in ${this.constructor.name}: %s`, msg);
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

	async getAll<Q extends BaseGetAllQuery>(
		query?: Q,
		requestConfig?: RequestInit,
	): Promise<ServiceResponse<z.output<GetAllResult>>> {
		try {
			const queryParams = new URLSearchParams();
			if (query !== undefined) {
				Object.entries(query).forEach(([key, value]) => {
					queryParams.append(
						key,
						(value as unknown) instanceof Date
							? Formatter.date.formatWithPattern(
									value as unknown as Date,
									"yyyy-MM-dd",
								)
							: String(value),
					);
				});
			}

			const requestId = this.createRequestId();
			const response = await fetch(
				`${this.getBaseRequestPath()}?${queryParams.toString()}`,
				this.mergeRequestConfig(
					{
						method: "GET",
						headers: this.enhanceHeadersWithRequestId(
							new Headers(requestConfig?.headers || {}),
							requestId,
						),
						credentials: "include",
					},
					requestConfig,
				),
			);
			this.logger.debug(
				"Received response for getAll (requestID=%s): %b %s %s",
				requestId,
				response.ok,
				response.status,
				response.statusText,
				{ requestId },
			);

			if (!response.ok) {
				this.logger.error(
					"Response not OK for getAll (requestID=%s): %s",
					await response.text(),
					{ requestId },
				);
				throw new Error(`Failed to fetch entities: ${response.statusText}`);
			}
			if (!this.isJsonResponse(response)) {
				throw new Error("Response is not JSON");
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
	): Promise<ServiceResponse<z.output<GetResult>>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/${entityId}`,
				this.mergeRequestConfig(
					{
						method: "GET",
						headers: this.enhanceHeadersWithRequestId(
							new Headers(requestConfig?.headers || {}),
						),
						credentials: "include",
					},
					requestConfig,
				),
			);
			if (!response.ok) {
				throw new Error(`Failed to fetch entity: ${response.statusText}`);
			}
			if (!this.isJsonResponse(response)) {
				throw new Error("Response is not JSON");
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
	): Promise<ServiceResponse<z.output<CreateResult>>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}`,
				this.mergeRequestConfig(
					{
						method: "POST",
						headers: this.enhanceHeadersWithRequestId(
							new Headers(
								requestConfig?.headers || {
									"Content-Type": "application/json",
								},
							),
						),
						credentials: "include",
						body: JSON.stringify(payload),
					},
					requestConfig,
				),
			);
			if (!response.ok) {
				throw new Error(`Failed to create entity: ${response.statusText}`);
			}
			if (!this.isJsonResponse(response)) {
				throw new Error("Response is not JSON");
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
	): Promise<ServiceResponse<z.output<UpdateResult>>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/${entityId}`,
				this.mergeRequestConfig(
					{
						method: "PUT",
						headers: this.enhanceHeadersWithRequestId(
							new Headers(
								requestConfig?.headers || {
									"Content-Type": "application/json",
								},
							),
						),
						credentials: "include",
						body: JSON.stringify(payload),
					},
					requestConfig,
				),
			);
			if (!response.ok) {
				throw new Error(`Failed to update entity: ${response.statusText}`);
			}
			if (!this.isJsonResponse(response)) {
				throw new Error("Response is not JSON");
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
	): Promise<ServiceResponse<z.output<DeleteResult>>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/${entityId}`,
				this.mergeRequestConfig(
					{
						method: "DELETE",
						headers: this.enhanceHeadersWithRequestId(
							new Headers(requestConfig?.headers || {}),
						),
						credentials: "include",
					},
					requestConfig,
				),
			);
			if (!response.ok) {
				throw new Error(`Failed to delete entity: ${response.statusText}`);
			}
			if (!this.isJsonResponse(response)) {
				throw new Error("Response is not JSON");
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

	protected isJsonResponse(response: Response): boolean {
		const contentType = response.headers.get("content-type");
		return contentType?.includes("application/json") || false;
	}
}
