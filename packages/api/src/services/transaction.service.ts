import type { z } from "zod";
import { BackendError, ResponseNotJsonError } from "../error";
import type { TResult } from "../types/common";
import type { IGetAllTransactionsQuery } from "../types/interfaces/transaction.interface";
import {
	CreateTransactionResponse,
	DeleteTransactionResponse,
	GetAllTransactionsResponse,
	GetTransactionAttachmentsResponse,
	GetTransactionResponse,
	ReceiverVHResponse,
	UpdateTransactionResponse,
	UploadTransactionAttachmentsResponse,
} from "../types/schemas/transaction.schema";
import type {
	TCreateOrUpdateTransactionPayload,
	TDeleteTransactionAttachmentsPayload,
	TGetTransactionAttachmentsQuery,
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

	/**
	 * Fetch all transaction attachments for the authenticated user (across all transactions).
	 */
	async getAllTransactionAttachments(
		query?: TGetTransactionAttachmentsQuery,
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<typeof GetTransactionAttachmentsResponse>>> {
		try {
			const params = this.reqQueryObjToURLSearchParams(query);
			const response = await fetch(
				`${this.getBaseRequestPath()}/attachments?${params.toString()}`,
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

			const parsingResult = GetTransactionAttachmentsResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}

	/**
	 * Fetch all attachments for a specific transaction.
	 */
	async getTransactionAttachments(
		transactionId: string,
		query?: TGetTransactionAttachmentsQuery,
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<typeof GetTransactionAttachmentsResponse>>> {
		try {
			const params = this.reqQueryObjToURLSearchParams(query);
			const response = await fetch(
				`${this.getBaseRequestPath()}/${transactionId}/attachments?${params.toString()}`,
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

			const parsingResult = GetTransactionAttachmentsResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}

	/**
	 * Upload attachments for a specific transaction.
	 */
	async uploadTransactionAttachments(
		transactionId: string,
		files: File[],
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<typeof UploadTransactionAttachmentsResponse>>> {
		try {
			const formData = new FormData();
			for (const file of files) {
				formData.append("files", file);
			}

			const response = await fetch(
				`${this.getBaseRequestPath()}/${transactionId}/attachments`,
				this.mergeRequestConfig(
					{
						method: "POST",
						credentials: "include",
						body: formData,
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

			const parsingResult =
				UploadTransactionAttachmentsResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}

	/**
	 * Delete attachments from a specific transaction.
	 * Optionally pass specific attachment IDs; if omitted, all transaction attachments are deleted.
	 */
	async deleteTransactionAttachments(
		transactionId: string,
		payload?: TDeleteTransactionAttachmentsPayload,
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<typeof DeleteTransactionResponse>>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/${transactionId}/attachments`,
				this.mergeRequestConfig(
					{
						method: "DELETE",
						headers: new Headers(
							requestConfig?.headers || {
								"Content-Type": "application/json",
							},
						),
						credentials: "include",
						body: payload ? JSON.stringify(payload) : undefined,
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

			const parsingResult = DeleteTransactionResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}
}
