import type { z } from "zod";
import { BackendError, ResponseNotJsonError } from "../error";
import type { TResult } from "../types/common";
import { GetAttachmentResponse } from "../types/schemas/attachment.schema";
import type {
	TAttachment,
	TGetAttachmentsQuery,
} from "../types/attachment.type";
import { BackendService } from "./backend.service";

export class AttachmentService extends BackendService {
	constructor(host: string, attachmentPath = "/api/attachment") {
		super(host, attachmentPath);
	}

	/**
	 * Retrieve a single attachment by ID with a signed URL.
	 */
	async getById(
		attachmentId: TAttachment["id"],
		query?: TGetAttachmentsQuery,
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
		attachmentId: TAttachment["id"],
		requestConfig?: RequestInit,
	): Promise<TResult<void>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/${attachmentId}`,
				this.mergeRequestConfig(
					{
						method: "DELETE",
						credentials: "include",
					},
					requestConfig,
				),
			);
			if (!response.ok) {
				throw new BackendError(response.status, response.statusText);
			}
			return [undefined, null];
		} catch (error) {
			return this.handleError(error);
		}
	}
}
