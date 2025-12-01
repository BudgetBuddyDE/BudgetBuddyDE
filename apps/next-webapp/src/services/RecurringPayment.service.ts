/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import type { ServiceResponse } from "@budgetbuddyde/types";
import type { OdataConfig, OdataQuery } from "@tklein1801/o.js";
import { z } from "zod";
import {
	ApiResponse,
	ExpandedRecurringPayment,
	ExpandedRecurringPaymentsWithCount,
	RecurringPayment,
	type TCreateOrUpdateRecurringPayment,
	type TExpandedRecurringPayment,
	type TExpandedRecurringPaymentsWithCount,
} from "@/types";
import {
	type BaseGetAllQuery,
	EntityService,
	NewEntityService,
} from "./Entity.service";

const GetAllRecurringPayment = ApiResponse.extend({
	data: z.array(ExpandedRecurringPayment).nullable(),
});

const GetRecurringPayment = ApiResponse.extend({
	data: ExpandedRecurringPayment.nullable(),
});
const PostRecurringPayment = ApiResponse.extend({
	data: z.array(RecurringPayment).nullable(),
});
const PutRecurringPayment = PostRecurringPayment;
const DeleteRecurringPayment = PostRecurringPayment;

export class RecurringPaymentService extends NewEntityService<
	TCreateOrUpdateRecurringPayment,
	TCreateOrUpdateRecurringPayment,
	typeof GetAllRecurringPayment,
	typeof GetRecurringPayment,
	typeof PostRecurringPayment,
	typeof PutRecurringPayment,
	typeof DeleteRecurringPayment
> {
	constructor() {
		super("/api/recurringPayment", {
			getAll: GetAllRecurringPayment,
			get: GetRecurringPayment,
			create: PostRecurringPayment,
			update: PutRecurringPayment,
			delete: DeleteRecurringPayment,
		});
	}

	async getAll(
		query?: BaseGetAllQuery & {
			$executeFrom?: number;
			$executeTo?: number;
		},
		requestConfig?: RequestInit,
	) {
		return super.getAll(query, requestConfig);
	}
}

export class SubscriptionService extends EntityService {
	static {
		this.entity = "Subscription";
	}

	/**
	 * Retrieves the list of subscriptions from the database.
	 * @returns A promise that resolves to an array of TTransaction objects.
	 * @throws If there is an error parsing the retrieved records.
	 */
	static async getSubscriptions(
		query?: OdataQuery,
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TExpandedRecurringPayment[]>> {
		try {
			const records = await this.newOdataHandler(config)
				.get(this.$entityPath)
				.query({
					$expand: "toCategory,toPaymentMethod",
					...query,
				});
			const parsingResult = z
				.array(ExpandedRecurringPayment)
				.safeParse(records);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}

	/**
	 * Retrieves the list of subscriptions from the database with a count of total subscriptions.
	 * @param query - The OData query parameters.
	 * @param config - The OData configuration options.
	 * @returns A promise that resolves to a ServiceResponse containing the subscriptions and their count.
	 */
	static async getSubscriptionsWithCount(
		query?: Omit<OdataQuery, "$count" | "$expand">,
		config?: Partial<Omit<OdataConfig, "fragment">>,
	): Promise<ServiceResponse<TExpandedRecurringPaymentsWithCount>> {
		try {
			const records = await this.newOdataHandler({
				...config,
				fragment: undefined,
			})
				.get(this.$entityPath)
				.query({
					...query,
					$expand: "toCategory,toPaymentMethod",
					$count: true,
				});
			this.logger.debug("Fetched subscriptions:", records);
			const parsingResult =
				ExpandedRecurringPaymentsWithCount.safeParse(records);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}
}
