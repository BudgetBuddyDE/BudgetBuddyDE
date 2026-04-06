import type { TypeOfSchema } from "./common";
import type * as schema from "./schemas/attachment.schema";

export type TSignedAttachmentUrl = TypeOfSchema<
	typeof schema.SignedAttachmentUrl
>;
export type TSignedAttachmentUrlTTL = TypeOfSchema<
	typeof schema.SignedAttachmentUrlTTL
>;
export type TAttachment = TypeOfSchema<typeof schema.Attachment>;
export type TAttachmentWithUrl = TypeOfSchema<typeof schema.AttachmentWithUrl>;
export type TCreateOrUpdateAttachmentPayload = TypeOfSchema<
	typeof schema.CreateAttachmentResponse
>;
export type TGetAttachmentsQuery = TypeOfSchema<
	typeof schema.GetAttachmentsQuery
>;
export type TDeleteAttachmentsPayload = TypeOfSchema<
	typeof schema.DeleteAttachmentsPayload
>;
export type TGetAttachmentsPagedResponse = TypeOfSchema<
	typeof schema.GetAttachmentsPagedResponse
>;
