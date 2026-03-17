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
export const AttachmentUsage = z.enum(["transaction"]);

export const Attachment = z.object({
	id: z.uuid({ version: "v7" }).brand("AttachmentID"),
	ownerId: UserID,
	usage: AttachmentUsage,
	fileName: z.string().length(255),
	fileExtension: z.string().length(16),
	contentType: z.mime(["image/png", "image/jpg", "image/jpeg", "image/webp"]),
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
