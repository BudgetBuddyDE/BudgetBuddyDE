/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import type { ServiceResponse } from "@budgetbuddyde/types";
import { type OdataConfig, type OHandler, o } from "@tklein1801/o.js";
import type { z } from "zod";
import { logger } from "@/logger";

// biome-ignore lint/complexity/noStaticOnlyClass: This class is a simple container for static services
export class EntityService {
	private static readonly $backendHost = process.env.NEXT_PUBLIC_BACKEND_SERVICE_HOST || "http://localhost:4004";
	private static readonly $odataClientConfig: Partial<OdataConfig> = {
		// TODO: Configure the $batch endpoint
		credentials: "include",
	};
	static entity: string;
	static $servicePath = "/odata/v4/backend";
	static $odata: OHandler;
	static readonly logger = logger.child({ label: this.name });

	static {
		this.$odata = o(this.$backendHost, this.$odataClientConfig);
	}

	static getEntityPath() {
		return `${this.$servicePath}/${this.entity}`;
	}

	static get $entityPath() {
		return `${this.$servicePath}/${this.entity}`;
	}

	/**
	 * Returns a new OData handler with the configured backend host and client settings.
	 * @returns A new OData handler instance.
	 */
	static newOdataHandler(config?: Partial<OdataConfig>): OHandler {
		return o(this.$backendHost, {
			...this.$odataClientConfig,
			...config,
		});
	}

	static handleZodError<T, S>(
		errors: z.ZodError<S>[] | z.ZodError<S>,
	): ServiceResponse<T> {
		const msg = Array.isArray(errors)
			? errors.map((e) => e.message).join(", ")
			: errors.message;
		logger.error(`ZodError in ${this.name}: %s`, msg);
		return [null, new Error(msg)];
	}

	static handleError<T>(e: unknown): ServiceResponse<T> {
		const msg = e instanceof Error ? e.message : String(e);
		logger.error(msg);
		if (e instanceof Response) {
			return [null, new Error(e.statusText)];
		}
		return [null, e instanceof Error ? e : new Error(msg)];
	}

	static async delete(
		entityId: string,
		cfg?: { entityName: string },
	): Promise<ServiceResponse<true>> {
		try {
			const response = await this.newOdataHandler()
				.delete(`${this.$entityPath}(ID=${entityId})`)
				.fetch();
			if (Array.isArray(response)) {
				const results = response.map((res) => res.ok);
				if (results.every((ok) => ok)) {
					return [true, null];
				}
				return this.handleError(
					new Error(`Failed to delete ${cfg?.entityName || "entity"}`),
				);
			} else if (!response.ok) {
				return this.handleError(
					new Error(`Failed to delete ${cfg?.entityName || "entity"}`),
				);
			}
			return [true, null];
		} catch (e) {
			return this.handleError(e);
		}
	}
}
