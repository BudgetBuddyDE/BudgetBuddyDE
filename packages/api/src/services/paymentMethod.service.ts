import z from "zod";
import { BackendError, ResponseNotJsonError } from "../error";
import type { TResult } from "../types/common";
import type {
	TCreateOrUpdatePaymentMethodPayload,
	TPaymentMethod,
	TPaymentMethodVH,
} from "../types/paymentMethod.type";
import {
	CreatePaymentMethodResponse,
	DeletePaymentMethodResponse,
	GetAllPaymentMethodsResponse,
	GetPaymentMethodResponse,
	MergePaymentMethodsResponse,
	PaymentMethodVH,
	UpdatePaymentMethodResponse,
} from "../types/schemas/paymentMethod.schema";
import { EntityService } from "./entity.service";

export class PaymentMethodService extends EntityService<
	TCreateOrUpdatePaymentMethodPayload,
	Partial<TCreateOrUpdatePaymentMethodPayload>,
	typeof GetAllPaymentMethodsResponse,
	typeof GetPaymentMethodResponse,
	typeof CreatePaymentMethodResponse,
	typeof UpdatePaymentMethodResponse,
	typeof DeletePaymentMethodResponse
> {
	constructor(host: string, entityPath = "/api/paymentMethod") {
		super(host, entityPath, {
			getAll: GetAllPaymentMethodsResponse,
			get: GetPaymentMethodResponse,
			create: CreatePaymentMethodResponse,
			update: UpdatePaymentMethodResponse,
			delete: DeletePaymentMethodResponse,
		});
	}

	async getValueHelp(
		requestConfig?: RequestInit,
	): Promise<TResult<TPaymentMethodVH[]>> {
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

	async merge(
		{
			source,
			target,
		}: {
			source: TPaymentMethod["id"][];
			target: TPaymentMethod["id"];
		},
		requestConfig?: RequestInit,
	): Promise<
		TResult<{
			source: Set<TPaymentMethod["id"]>;
			target: TPaymentMethod["id"];
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

			const parsingResult = MergePaymentMethodsResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}
}
