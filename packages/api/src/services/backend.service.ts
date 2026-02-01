import type { z } from "zod";
import type { TResult } from "../types/common";

export class BackendService {
	/**
	 * The backend host URL
	 * @example `https://api.budgetbuddy.de`
	 */
	protected host: string;
	/**
	 * The base path for the backend API
	 * @example `/attachment/v1`
	 */
	protected basePath: string;

	constructor(host: string, basePath: string) {
		this.host = host;
		this.basePath = basePath;
	}

	/**
	 * Returns the complete base request path.
	 * @returns The combined host and base path
	 */
	protected getBaseRequestPath() {
		return `${this.host}${this.basePath}`;
	}

	/**
	 * Handles errors and converts them into TResult format.
	 * @param e - The error to handle
	 * @returns A TResult tuple with null as data and the error
	 */
	protected handleError<T>(e: unknown): TResult<T> {
		const msg = e instanceof Error ? e.message : String(e);
		return [null, e instanceof Error ? e : new Error(msg)];
	}

	/**
	 * Handles Zod validation errors and converts them into TResult format.
	 * Logs the error to the console.
	 * @param errors - A single or multiple Zod errors
	 * @returns A TResult tuple with null as data and the error
	 */
	protected handleZodError<T, S>(
		errors: z.ZodError<S>[] | z.ZodError<S>,
	): TResult<T> {
		const msg = Array.isArray(errors)
			? errors.map((e) => e.message).join(", ")
			: errors.message;
		console.error(`ZodError in ${this.constructor.name}: %s`, msg);
		return [null, new Error(msg)];
	}

	/**
	 * Merges two RequestInit configurations together.
	 * Headers are intelligently merged, with config2 overriding config1.
	 * @param config1 - The base configuration
	 * @param config2 - The optional override configuration
	 * @returns The merged RequestInit configuration
	 */
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

	/**
	 * Checks if the response has a JSON content type.
	 * This method does not verify that the actually content is valid JSON.
	 */
	protected isJsonResponse(response: Response): boolean {
		const contentType = response.headers.get("content-type");
		return contentType?.includes("application/json") || false;
	}

	/**
	 * Converts a query object to URLSearchParams.
	 * Date objects are converted to ISO 8601 compliant YYYY-MM-DD format using en-CA locale.
	 * All other values are converted to strings.
	 * @param query - Optional record of query parameters
	 * @returns URLSearchParams ready to be appended to a URL
	 */
	protected reqQueryObjToURLSearchParams(query?: object): URLSearchParams {
		const queryParams = new URLSearchParams();
		if (query === undefined) return queryParams;

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
		return queryParams;
	}
}
