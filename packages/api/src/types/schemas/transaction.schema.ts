import z from 'zod';
import {AttachmentWithUrl, DeleteAttachmentsPayload, GetAttachmentsQuery} from './attachment.schema';
import {Category} from './category.schema';
import {ApiResponse, UserID} from './common.schema';
import {PaymentMethod} from './paymentMethod.schema';

export const Transaction = z.object({
  id: z.uuid().brand('TransactionID'),
  ownerId: UserID,
  categoryId: Category.shape.id,
  paymentMethodId: PaymentMethod.shape.id,
  processedAt: z.iso.datetime().or(z.date()),
  receiver: z.string(),
  transferAmount: z.number(),
  information: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ExpandedTransaction = Transaction.omit({
  categoryId: true,
  paymentMethodId: true,
}).extend({
  category: Category,
  paymentMethod: PaymentMethod,
  attachments: z.array(AttachmentWithUrl).optional(),
  attachmentCount: z.number().optional(),
});

export const TransactionAttachment = z.object({
  transactionId: Transaction.shape.id,
  attachmentId: z.uuid({version: 'v7'}).brand('AttachmentID'),
});

export const GetTransactionAttachmentsQuery = GetAttachmentsQuery;
export const DeleteTransactionAttachmentsPayload = DeleteAttachmentsPayload;
export const GetTransactionAttachmentsResponse = ApiResponse.extend({
  data: z.array(AttachmentWithUrl).nullable(),
  totalCount: z.number().optional(),
});
export const UploadTransactionAttachmentsResponse = ApiResponse.extend({
  data: z.array(AttachmentWithUrl).nullable(),
});

// export const CreateTransactionPayload = Transaction.pick({
// 	categoryId: true,
// 	paymentMethodId: true,
// 	processedAt: true,
// 	receiver: true,
// 	transferAmount: true,
// 	information: true,
// }).extend({
// 	information: Transaction.shape.information.optional(),
// });

// export const UpdateTransactionPayload = Transaction.pick({
// 	categoryId: true,
// 	paymentMethodId: true,
// 	processedAt: true,
// 	receiver: true,
// 	transferAmount: true,
// 	information: true,
// }).extend({
// 	information: Transaction.shape.information.optional(),
// });

export const CreateOrUpdateTransactionPayload = Transaction.pick({
  categoryId: true,
  paymentMethodId: true,
  processedAt: true,
  receiver: true,
  transferAmount: true,
  information: true,
}).extend({
  information: Transaction.shape.information.optional(),
});

export const BatchCreateTransactionPayload = z.array(CreateOrUpdateTransactionPayload).min(1).max(100);
export const BatchUpdateTransactionPayload = z
  .object({
    updates: z
      .array(
        z.object({
          id: Transaction.shape.id,
          data: CreateOrUpdateTransactionPayload.partial(),
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine(({updates}, ctx) => {
    if (new Set(updates.map(update => update.id)).size !== updates.length) {
      ctx.addIssue({code: 'custom', path: ['updates'], message: 'Update IDs must be unique'});
    }
  });

export const ReceiverVH = Transaction.pick({
  receiver: true,
});

export const GetAllTransactionsResponse = ApiResponse.extend({
  data: z.array(ExpandedTransaction).nullable(),
});
export const GetTransactionResponse = ApiResponse.extend({
  data: ExpandedTransaction.nullable(),
});
export const CreateTransactionResponse = ApiResponse.extend({
  data: z.array(Transaction).nullable(),
});
export const UpdateTransactionResponse = CreateTransactionResponse;
export const BatchCreateTransactionResponse = CreateTransactionResponse;
export const BatchUpdateTransactionResponse = UpdateTransactionResponse;
export const DeleteTransactionResponse = CreateTransactionResponse;
export const ReceiverVHResponse = ApiResponse.extend({
  data: z.array(ReceiverVH).nullable(),
});
