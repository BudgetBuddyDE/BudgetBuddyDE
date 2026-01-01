import { BackendError, ResponseNotJsonError } from "../error";
import type { TResult } from "../types/common";
import type { IGetAllTransactionsQuery } from "../types/interfaces/transaction.interface";
import {
	CreateTransactionResponse,
	DeleteTransactionResponse,
	GetAllTransactionsResponse,
	GetTransactionResponse,
	ReceiverVHResponse,
	UpdateTransactionResponse,
} from "../types/schemas/transaction.schema";
import type {
	TCreateOrUpdateTransactionPayload,
	TReceiverVH,
} from "../types/transaction.type";
import { EntityService } from "./entity.service";

export class TransactionService extends EntityService<
	TCreateOrUpdateTransactionPayload,
	Partial<TCreateOrUpdateTransactionPayload>,
	typeof GetAllTransactionsResponse,
	typeof GetTransactionResponse,
	typeof CreateTransactionResponse,
	typeof UpdateTransactionResponse,
	typeof DeleteTransactionResponse
> {
	constructor(host: string, entityPath = "/api/transaction") {
		super(host, entityPath, {
			getAll: GetAllTransactionsResponse,
			get: GetTransactionResponse,
			create: CreateTransactionResponse,
			update: UpdateTransactionResponse,
			delete: DeleteTransactionResponse,
		});
	}

	async getAll(query?: IGetAllTransactionsQuery, requestConfig?: RequestInit) {
		return super.getAll(query, requestConfig);
	}

	async getReceiverVH(
		requestConfig?: RequestInit,
	): Promise<TResult<TReceiverVH[]>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/receiver`,
				this.mergeRequestConfig(
					{
						method: "GET",
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

			const parsingResult = ReceiverVHResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data.data ?? [], null];
		} catch (error) {
			return this.handleError(error);
		}
	}
}
