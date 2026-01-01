import z from "zod";
import { Category } from "./category.schema";
import { ApiResponse, UserID } from "./common.schema";
import { PaymentMethod } from "./paymentMethod.schema";

export const Transaction = z.object({
	id: z.uuid().brand("TransactionID"),
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
export const DeleteTransactionResponse = CreateTransactionResponse;
export const ReceiverVHResponse = ApiResponse.extend({
	data: z.array(ReceiverVH).nullable(),
});
