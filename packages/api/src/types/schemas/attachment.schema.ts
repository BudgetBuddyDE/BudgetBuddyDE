import { z } from "zod";
import { ApiResponse, UserID } from "./common.schema";
import { Transaction } from "./transaction.schema";

export const SignedAttachmentUrl = z.url().brand("SignedAttachmentUrl");
/**
 * Time to live for signed URL in seconds
 */
export const SignedAttachmentUrlTTL = z.coerce
	.number()
	.min(60)
	.max(3600)
	.brand("SignedAttachmentUrlTTL");
export const AttachmentUsage = z.enum(["avatar", "transaction"]);
// .brand("AttachmentUsage");

/**
 * Represents a file attachment uploaded by a user as an database record.
 */
export const Attachment = z.object({
	id: z.uuidv7().brand("AttachmentId"),
	ownerId: UserID,
	usage: AttachmentUsage,
	fileName: z.string().min(1).max(255, { error: "File name too long" }),
	fileExtension: z
		.string()
		.min(1)
		.max(16, { error: "File extension too long" }),
	contentType: z.string().min(1).max(128, { error: "MIME type too long" }),
	location: z.string(),
	createdAt: z.iso.datetime(),
});

export const AttachmentDTO = Attachment.pick({
	id: true,
	ownerId: true,
	usage: true,
	fileName: true,
	fileExtension: true,
	contentType: true,
	createdAt: true,
}).extend({
	url: SignedAttachmentUrl,
});

export const UploadAttachmentPayload = z.discriminatedUnion("usage", [
	z.object({ usage: z.literal("avatar") }),
	z.object({
		usage: z.literal("transaction"),
		transactionId: Transaction.shape.id,
	}),
]);

export const GetAllAttachmentsResponse = ApiResponse.extend({
	data: z.array(AttachmentDTO),
});
export const GetAttachmentResponse = ApiResponse.extend({
	data: AttachmentDTO,
});
export const UploadAttachmentsResponse = ApiResponse.extend({
	data: z.array(AttachmentDTO),
});
export const DeleteAttachmentResponse = ApiResponse.extend({
	data: z.null(),
});
