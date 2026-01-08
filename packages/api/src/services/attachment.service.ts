import {
	DeleteAttachmentResponse,
	GetAllAttachmentsResponse,
	GetAttachmentResponse,
	type IGetAllAttachmentsQuery,
	type TAttachment,
	type TAttachmentDTO,
	type TUploadAttachmentPayload,
	UploadAttachmentsResponse,
} from "../attachment";
import type { TResult } from "../common";
import { BackendError, ResponseNotJsonError } from "../error";
import { BackendService } from "./backend.service";

export class AttachmentService extends BackendService {
	constructor(host: string) {
		super(host, "/api/attachment");
	}

	private async getAllByUsage<Query extends IGetAllAttachmentsQuery>(
		query: Query,
		requestConfig?: RequestInit,
	): Promise<TResult<TAttachmentDTO[]>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}?${this.reqQueryObjToURLSearchParams(query).toString()}`,
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

			return [parsingResult.data.data, null];
		} catch (err) {
			return this.handleError(err);
		}
	}

	async getAvatars<Query extends Pick<IGetAllAttachmentsQuery, "ttl">>(
		query: Query,
		requestConfig?: RequestInit,
	) {
		return this.getAllByUsage({ usage: "avatar", ...query }, requestConfig);
	}

	async getTransactionAttachments<
		Query extends Pick<IGetAllAttachmentsQuery, "ttl">,
	>(query: Query, requestConfig?: RequestInit) {
		return this.getAllByUsage(
			{ usage: "transaction", ...query },
			requestConfig,
		);
	}

	async getById(
		attachmentId: TAttachment["id"],
		requestConfig?: RequestInit,
	): Promise<TResult<TAttachmentDTO>> {
		try {
			const response = await fetch(
				`${this.getBaseRequestPath()}/${attachmentId}`,
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

			return [parsingResult.data.data, null];
		} catch (err) {
			return this.handleError(err);
		}
	}

	async upload(
		payload: TUploadAttachmentPayload,
		files: FileList,
		requestConfig?: RequestInit,
	): Promise<TResult<TAttachmentDTO[]>> {
		try {
			const form = new FormData();
			Object.entries(payload).forEach(([key, value]) => {
				form.append(key, value.toString());
			});
			Array.from(files).forEach((file) => {
				form.append("files", file, file.name);
			});

			const response = await fetch(
				`${this.getBaseRequestPath()}`,
				this.mergeRequestConfig(
					{
						method: "POST",
						headers: new Headers(requestConfig?.headers || {}),
						credentials: "include",
						body: form,
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

			const parsingResult = UploadAttachmentsResponse.safeParse(data);
			if (!parsingResult.success) {
				return this.handleZodError(parsingResult.error);
			}

			return [parsingResult.data.data, null];
		} catch (err) {
			return this.handleError(err);
		}
	}

	async deleteById(
		attachmentId: TAttachment["id"],
		requestConfig?: RequestInit,
	): Promise<TResult<null>> {
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

			return [parsingResult.data.data, null];
		} catch (err) {
			return this.handleError(err);
		}
	}
}
