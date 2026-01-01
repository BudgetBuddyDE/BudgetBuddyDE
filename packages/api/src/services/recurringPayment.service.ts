import type { IGetAllRecurringPaymentsQuery } from "../types/interfaces/recurringPayment.interface";
import type {
	TCreateOrUpdateRecurringPaymentPayload,
	TExpandedRecurringPayment,
} from "../types/recurringPayment.type";
import {
	CreateRecurringPaymentResponse,
	DeleteRecurringPaymentResponse,
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
}
