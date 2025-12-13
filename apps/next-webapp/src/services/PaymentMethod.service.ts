/** biome-ignore-all lint/complexity/noThisInStatic: It will break the implementation */
import type { ServiceResponse } from "@budgetbuddyde/types";
import { z } from "zod";
import {
	ApiResponse,
	PaymentMethod,
	PaymentMethodVH,
	type TCreateOrUpdatePaymentMethod,
	type TPaymentMethodVH,
} from "@/types";
import { NewEntityService } from "./Entity.service";

const GetAllPaymentMethods = ApiResponse.extend({
	data: z.array(PaymentMethod).nullable(),
});
const GetPaymentMethod = ApiResponse.extend({
	data: PaymentMethod.nullable(),
});
const PostPaymentMethod = GetAllPaymentMethods;
const PutPaymentMethod = GetAllPaymentMethods;
const DeletePaymentMethod = GetAllPaymentMethods;

export class PaymentMethodService extends NewEntityService<
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
