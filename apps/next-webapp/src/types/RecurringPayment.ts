import { z } from "zod";
import { ExpandedTransaction, Transaction } from "./Transaction";

// Base model
export const RecurringPayment = Transaction.omit({
	processedAt: true,
}).extend({
	paused: z.boolean().default(false),
	executeAt: z.number().min(1).max(31),
});
export type TRecurringPayment = z.infer<typeof RecurringPayment>;

export const ExpandedRecurringPayment = ExpandedTransaction.omit({
	processedAt: true,
}).extend({
	paused: z.boolean().default(false),
	executeAt: z.number().min(1).max(31),
});
export type TExpandedRecurringPayment = z.infer<
	typeof ExpandedRecurringPayment
>;

export const CreateOrUpdateRecurringPayment = RecurringPayment.pick({
	executeAt: true,
	paused: true,
	categoryId: true,
	paymentMethodId: true,
	receiver: true,
	transferAmount: true,
	information: true,
});
export type TCreateOrUpdateRecurringPayment = Partial<
	z.infer<typeof CreateOrUpdateRecurringPayment>
>;
