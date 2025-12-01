import { z } from "zod";
import { ODataContextAspect, ODataCountAspect, UserID } from "./_Base";
import { Category } from "./Category";
import { PaymentMethod } from "./PaymentMethod";

// Base model
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
export type TTransaction = z.infer<typeof Transaction>;

export const ExpandedTransaction = Transaction.omit({
	categoryId: true,
	paymentMethodId: true,
}).extend({
	category: Category,
	paymentMethod: PaymentMethod,
});
export type TExpandedTransaction = z.infer<typeof ExpandedTransaction>;

export const CreateOrUpdateTransaction = Transaction.pick({
	categoryId: true,
	paymentMethodId: true,
	processedAt: true,
	receiver: true,
	transferAmount: true,
	information: true,
});
export type TCreateOrUpdateTransaction = z.infer<
	typeof CreateOrUpdateTransaction
>;

/**
 * Transactions with Count
 */
export const ExpandedTransactionsWithCount = z.object({
	...ODataContextAspect.shape,
	...ODataCountAspect.shape,
	value: z.array(ExpandedTransaction),
});
/**
 * Transactions with Count
 */
export type TExpandedTransactionsWithCount = z.infer<
	typeof ExpandedTransactionsWithCount
>;

/**
 * Receiver
 */
export const ReceiverVH = Transaction.pick({
	receiver: true,
});
export type TReceiverVH = z.infer<typeof ReceiverVH>;
