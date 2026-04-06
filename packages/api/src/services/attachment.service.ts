import type { z } from "zod";
import { BackendError, ResponseNotJsonError } from "../error";
import type { TGetAttachmentsQuery } from "../types/attachment.type";
import type { TResult } from "../types/common";
import {
	DeleteAttachmentResponse,
	GetAttachmentResponse,
	GetAttachmentsPagedResponse,
} from "../types/schemas/attachment.schema";
import { BackendService } from "./backend.service";

export class AttachmentService extends BackendService {
	constructor(host: string, entityPath = "/api/attachment") {
		super(host, entityPath);
	}

	/**
	 * Retrieve all transaction attachments for the authenticated user (paginated).
	 */
	async getAllTransactionAttachments(
		query?: TGetAttachmentsQuery,
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<typeof GetAttachmentsPagedResponse>>> {
		try {
			const params = this.reqQueryObjToURLSearchParams(query);
			const response = await fetch(
				`${this.host}/api/transaction/attachments?${params.toString()}`,
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

			const parsingResult = GetAttachmentsPagedResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}

	/**
	 * Retrieve a single attachment by ID with a signed URL.
	 */
	async getById(
		attachmentId: string,
		query?: Pick<TGetAttachmentsQuery, "ttl">,
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<typeof GetAttachmentResponse>>> {
		try {
			const params = this.reqQueryObjToURLSearchParams(query);
			const response = await fetch(
				`${this.getBaseRequestPath()}/${attachmentId}?${params.toString()}`,
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

			const parsingResult = GetAttachmentResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}

	/**
	 * Delete a single attachment by ID.
	 */
	async deleteById(
		attachmentId: string,
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<typeof DeleteAttachmentResponse>>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/${attachmentId}`,
				this.mergeRequestConfig(
					{
						method: "DELETE",
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

			const parsingResult = DeleteAttachmentResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}
}
