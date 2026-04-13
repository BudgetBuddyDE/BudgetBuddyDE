import z from "zod";
import { ApiResponse, UserID } from "./common.schema";

export const SignedAttachmentUrl = z.url().brand("SignedAttachmentUrl");
/**
 * Time to live for signed URL in seconds
 */
export const SignedAttachmentUrlTTL = z.coerce
	.number()
	.min(60)
	.max(3600)
	.brand("SignedAttachmentUrlTTL");

export const Attachment = z.object({
	id: z.uuid({ version: "v7" }).brand("AttachmentID"),
	ownerId: UserID,
	fileName: z.string().max(255),
	fileExtension: z.string().max(16),
	contentType: z.enum(["image/png", "image/jpg", "image/jpeg", "image/webp"]),
	location: z.string(),
	createdAt: z.iso.datetime(),
});

export const AttachmentWithUrl = Attachment.extend({
	signedUrl: z.url(),
});

export const GetAllAttachmentsResponse = ApiResponse.extend({
	data: z.array(AttachmentWithUrl).nullable(),
});
export const GetAttachmentResponse = ApiResponse.extend({
	data: AttachmentWithUrl.nullable(),
});
export const CreateAttachmentResponse = ApiResponse.extend({
	data: z.array(AttachmentWithUrl).nullable(),
});
export const UpdateAttachmentResponse = undefined;
export const DeleteAttachmentResponse = CreateAttachmentResponse.extend({});

/** Paginated response for listing attachments */
export const GetAttachmentsPagedResponse = ApiResponse.extend({
	data: z.array(AttachmentWithUrl).nullable(),
	totalCount: z.number().optional(),
});

/** Query parameters for fetching attachments */
export const GetAttachmentsQuery = z.object({
	from: z.number().optional(),
	to: z.number().optional(),
	ttl: SignedAttachmentUrlTTL.optional(),
});

/** Optional list of attachment IDs to target for deletion */
export const DeleteAttachmentsPayload = z.object({
	attachmentIds: z.array(z.uuid()).optional(),
});
