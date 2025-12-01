/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import type { ServiceResponse } from "@budgetbuddyde/types";
import type { OdataConfig, OdataQuery } from "@tklein1801/o.js";
import { z } from "zod";
import {
	ApiResponse,
	PaymentMethod,
	PaymentMethodsWithCount,
	PaymentMethodVH,
	type TCreateOrUpdatePaymentMethod,
	type TPaymentMethodsWithCount,
	type TPaymentMethodVH,
} from "@/types";
import { EntityService, NewEntityService } from "./Entity.service";

const GetAllPaymentMethods = ApiResponse.extend({
	data: z.array(PaymentMethod).nullable(),
});
const GetPaymentMethod = ApiResponse.extend({
	data: PaymentMethod.nullable(),
});
const PostPaymentMethod = GetAllPaymentMethods;
const PutPaymentMethod = GetAllPaymentMethods;
const DeletePaymentMethod = GetAllPaymentMethods;

export class NewPaymentMethodService extends NewEntityService<
	TCreateOrUpdatePaymentMethod,
	TCreateOrUpdatePaymentMethod,
	typeof GetAllPaymentMethods,
	typeof GetPaymentMethod,
	typeof PostPaymentMethod,
	typeof PutPaymentMethod,
	typeof DeletePaymentMethod
> {
	constructor() {
		super("/api/paymentMethod", {
			getAll: GetAllPaymentMethods,
			get: GetPaymentMethod,
			create: PostPaymentMethod,
			update: PutPaymentMethod,
			delete: DeletePaymentMethod,
		});
	}

	async getValueHelp(
		requestConfig?: RequestInit,
	): Promise<ServiceResponse<TPaymentMethodVH[]>> {
		const [paymentMethods, error] = await this.getAll(undefined, requestConfig);
		if (error) {
			this.handleError(error);
		}

		const valueHelpValues = z
			.array(PaymentMethodVH)
			.safeParse(paymentMethods?.data ?? []);
		if (!valueHelpValues.success) {
			return this.handleZodError(valueHelpValues.error);
		}
		return [valueHelpValues.data, null];
	}
}

export class PaymentMethodService extends EntityService {
	static {
		this.entity = "PaymentMethod";
	}

	/**
	 * Retrieves the list of payment methods from the database with a count of total payment methods.
	 * @param query - The OData query parameters.
	 * @param config - The OData configuration options.
	 * @returns A promise that resolves to a ServiceResponse containing the payment methods and their count.
	 */
	static async getPaymentMethodsWithCount(
		query?: Omit<OdataQuery, "$count">,
		config?: Partial<Omit<OdataConfig, "fragment">>,
	): Promise<ServiceResponse<TPaymentMethodsWithCount>> {
		try {
			const records = await this.newOdataHandler({
				...config,
				fragment: undefined,
			})
				.get(this.$entityPath)
				.query({ ...query, $count: true });
			this.logger.debug("Fetched payment methods:", records);
			const parsingResult = PaymentMethodsWithCount.safeParse(records);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return this.handleError(e);
		}
	}
}
