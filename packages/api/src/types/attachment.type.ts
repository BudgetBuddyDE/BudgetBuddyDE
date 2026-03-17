import type { TypeOfSchema } from "./common";
import type * as schema from "./schemas/attachment.schema";

export type TSignedAttachmentUrl = TypeOfSchema<
	typeof schema.SignedAttachmentUrl
>;
export type TSignedAttachmentUrlTTL = TypeOfSchema<
	typeof schema.SignedAttachmentUrlTTL
>;
export type TAttachmentUsage = TypeOfSchema<typeof schema.AttachmentUsage>;
export type TAttachment = TypeOfSchema<typeof schema.Attachment>;
export type TAttachmentWithUrl = TypeOfSchema<typeof schema.AttachmentWithUrl>;
export type TCreateOrUpdateAttachmentPayload = TypeOfSchema<
	typeof schema.CreateAttachmentResponse
>;
