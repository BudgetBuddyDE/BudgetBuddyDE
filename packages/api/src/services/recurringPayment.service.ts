import { BackendError, ResponseNotJsonError } from "../error";
import type { TResult } from "../types/common";
import type { IGetAllRecurringPaymentsQuery } from "../types/interfaces/recurringPayment.interface";
import type {
	TCreateOrUpdateRecurringPaymentPayload,
	TExecuteRecurringPaymentResponse,
	TExpandedRecurringPayment,
} from "../types/recurringPayment.type";
import {
	CreateRecurringPaymentResponse,
	DeleteRecurringPaymentResponse,
	ExecuteRecurringPaymentResponse,
	GetAllRecurringPaymentsResponse,
	GetRecurringPaymentResponse,
	UpdateRecurringPaymentResponse,
} from "../types/schemas/recurringPayment.schema";
import { EntityService } from "./entity.service";

export class RecurringPaymentService extends EntityService<
	TCreateOrUpdateRecurringPaymentPayload,
	Partial<TCreateOrUpdateRecurringPaymentPayload>,
	typeof GetAllRecurringPaymentsResponse,
	typeof GetRecurringPaymentResponse,
	typeof CreateRecurringPaymentResponse,
	typeof UpdateRecurringPaymentResponse,
	typeof DeleteRecurringPaymentResponse
> {
	constructor(host: string, entityPath = "/api/recurringPayment") {
		super(host, entityPath, {
			getAll: GetAllRecurringPaymentsResponse,
			get: GetRecurringPaymentResponse,
			create: CreateRecurringPaymentResponse,
			update: UpdateRecurringPaymentResponse,
			delete: DeleteRecurringPaymentResponse,
		});
	}

	async getAll(
		query?: IGetAllRecurringPaymentsQuery,
		requestConfig?: RequestInit,
	) {
		return super.getAll(query, requestConfig);
	}

	determineNextExecutionDate(
		executeAt: TExpandedRecurringPayment["executeAt"],
	): Date {
		const today = new Date();
		return today.getDate() < executeAt
			? new Date(today.getFullYear(), today.getMonth(), executeAt)
			: new Date(today.getFullYear(), today.getMonth() + 1, executeAt);
	}

	async executePayment(
		recurringPaymentId: string,
		requestConfig?: RequestInit,
	): Promise<TResult<TExecuteRecurringPaymentResponse>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/${recurringPaymentId}/execute`,
				this.mergeRequestConfig(
					{
						method: "POST",
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

			const parsingResult = ExecuteRecurringPaymentResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}
}
