import type { TAttachmentUsage } from "../attachment.type";

export interface IGetAllAttachmentsQuery {
	usage: TAttachmentUsage;
	ttl?: number;
}
