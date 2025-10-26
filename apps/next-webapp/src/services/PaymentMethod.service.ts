import type { ServiceResponse } from "@budgetbuddyde/types";
import type { OdataConfig, OdataQuery } from "@tklein1801/o.js";
import { z } from "zod";
import {
	PaymentMethod,
	PaymentMethod_VH,
	PaymentMethodResponse,
	PaymentMethodsWithCount,
	type TCreateOrUpdatePaymentMethod,
	type TPaymentMethod,
	type TPaymentMethod_VH,
	type TPaymentMethodResponse,
	type TPaymentMethodsWithCount,
} from "@/types";
import { EntityService } from "./Entity.service";

export class PaymentMethodService extends EntityService {
	static {
		PaymentMethodService.entity = "PaymentMethod";
	}

	/**
	 * Creates a new payment method.
	 * @param payload The payment method data to create.
	 * @returns A promise that resolves to the created payment method or an error.
	 */
	static async create(
		payload: TCreateOrUpdatePaymentMethod,
	): Promise<ServiceResponse<TPaymentMethodResponse>> {
		try {
			const record = await PaymentMethodService.newOdataHandler()
				.post(PaymentMethodService.$entityPath, payload)
				.query();
			const parsingResult = PaymentMethodResponse.safeParse(record);
			if (!parsingResult.success) {
				return PaymentMethodService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return PaymentMethodService.handleError(e);
		}
	}

	/**
	 * Updates an existing payment method.
	 * @param entityId The ID of the payment method to update.
	 * @param payload The updated payment method data.
	 * @returns A promise that resolves to the updated payment method or an error.
	 */
	static async update(
		entityId: string,
		payload: TCreateOrUpdatePaymentMethod,
	): Promise<ServiceResponse<TPaymentMethod>> {
		try {
			const record = await PaymentMethodService.newOdataHandler()
				.patch(`${PaymentMethodService.$entityPath}(ID=${entityId})`, payload)
				.query();
			const parsingResult = PaymentMethodResponse.safeParse(record);
			if (!parsingResult.success) {
				return PaymentMethodService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return PaymentMethodService.handleError(e);
		}
	}

	/**
	 * Retrieves the list of payment methods from the database.
	 * @returns A promise that resolves to an array of TPaymentMethod objects.
	 * @throws If there is an error parsing the retrieved records.
	 */
	static async getPaymentMethods(
		query?: OdataQuery,
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TPaymentMethod[]>> {
		try {
			const records = await PaymentMethodService.newOdataHandler(config)
				.get(PaymentMethodService.$entityPath)
				.query(query);
			const parsingResult = z.array(PaymentMethod).safeParse(records);
			if (!parsingResult.success) {
				return PaymentMethodService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return PaymentMethodService.handleError(e);
		}
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
			const records = await PaymentMethodService.newOdataHandler({
				...config,
				fragment: undefined,
			})
				.get(PaymentMethodService.$entityPath)
				.query({ ...query, $count: true });
			PaymentMethodService.logger.debug("Fetched payment methods:", records);
			const parsingResult = PaymentMethodsWithCount.safeParse(records);
			if (!parsingResult.success) {
				return PaymentMethodService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return PaymentMethodService.handleError(e);
		}
	}

	static async getPaymentMethodVH(
		query?: OdataQuery,
		config?: Partial<OdataConfig>,
	): Promise<ServiceResponse<TPaymentMethod_VH[]>> {
		try {
			const records = await PaymentMethodService.newOdataHandler(config)
				.get(`${PaymentMethodService.$servicePath}/PaymentMethod_VH`)
				.query(query);
			const parsingResult = z.array(PaymentMethod_VH).safeParse(records);
			if (!parsingResult.success) {
				return PaymentMethodService.handleZodError(parsingResult.error);
			}
			return [parsingResult.data, null];
		} catch (e) {
			return PaymentMethodService.handleError(e);
		}
	}
}
