import type { z } from "zod";
import { BackendError, ResponseNotJsonError } from "../error";
import type { TResult } from "../types/common";
import type { IGetAllAttachmentsQuery } from "../types/interfaces/attachment.interface";
import { GetAllAttachmentsResponse } from "../types/schemas/attachment.schema";
import { BackendService } from "./backend.service";

export class AttachmentService extends BackendService {
	constructor(host: string, basePath = "/api/transaction/attachments") {
		super(host, basePath);
	}

	/**
	 * Fetch all transaction attachments for the authenticated user.
	 *
	 * Calls `GET /api/transaction/attachments` and returns a paginated list of
	 * attachments including pre-signed download URLs.
	 */
	async getAll(
		query?: IGetAllAttachmentsQuery,
		requestConfig?: RequestInit,
	): Promise<TResult<z.output<typeof GetAllAttachmentsResponse>>> {
		try {
			const params = this.reqQueryObjToURLSearchParams(query);
			const response = await fetch(
				`${this.getBaseRequestPath()}?${params.toString()}`,
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

			const parsingResult = GetAllAttachmentsResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data, null];
		} catch (error) {
			return this.handleError(error);
		}
	}
}
