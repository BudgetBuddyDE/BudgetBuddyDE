import { z } from "zod";
import { ApiResponse } from "./common.schema";
import { ExpandedTransaction, Transaction } from "./transaction.schema";

export const ExecutionPlan = z.enum([
	"daily",
	"weekly",
	"bi-weekly",
	"monthly",
	"quarterly",
	"yearly",
]);

export const RecurringPayment = Transaction.omit({
	processedAt: true,
}).extend({
	paused: z.boolean().default(false),
	/**
	 * Interpretation depends on `executionPlan`:
	 * - daily:            ignored (stored as 1)
	 * - weekly/bi-weekly: ISO day of week (1 = Monday … 7 = Sunday)
	 * - monthly/quarterly/yearly: day of month (1–31)
	 */
	executeAt: z.number().min(1).max(31),
	executionPlan: ExecutionPlan.default("monthly"),
});

export const ExpandedRecurringPayment = ExpandedTransaction.omit({
	processedAt: true,
}).extend({
	paused: z.boolean().default(false),
	executeAt: z.number().min(1).max(31),
	executionPlan: ExecutionPlan.default("monthly"),
});

// export const CreateRecurringPaymentPayload = RecurringPayment.pick({
// 	executeAt: true,
// 	paused: true,
// 	categoryId: true,
// 	paymentMethodId: true,
// 	receiver: true,
// 	transferAmount: true,
// 	information: true,
// }).extend({
// 	information: RecurringPayment.shape.information.optional(),
// });

// export const UpdateRecurringPaymentPayload = RecurringPayment.pick({
// 	executeAt: true,
// 	paused: true,
// 	categoryId: true,
// 	paymentMethodId: true,
// 	receiver: true,
// 	transferAmount: true,
// 	information: true,
// }).extend({
// 	information: RecurringPayment.shape.information.optional(),
// });

export const CreateOrUpdateRecurringPaymentPayload = RecurringPayment.pick({
	executeAt: true,
	executionPlan: true,
	paused: true,
	categoryId: true,
	paymentMethodId: true,
	receiver: true,
	transferAmount: true,
	information: true,
}).extend({
	information: RecurringPayment.shape.information.optional(),
});

export const RecurringPaymentExecution = z.object({
	recurringPaymentId: z.string().uuid(),
	executionDate: z.coerce.date(),
});

export const GetAllRecurringPaymentsResponse = ApiResponse.extend({
	data: z.array(ExpandedRecurringPayment).nullable(),
});
export const GetRecurringPaymentResponse = ApiResponse.extend({
	data: ExpandedRecurringPayment.nullable(),
});
export const CreateRecurringPaymentResponse = ApiResponse.extend({
	data: z.array(RecurringPayment).nullable(),
});
export const UpdateRecurringPaymentResponse = CreateRecurringPaymentResponse;
export const DeleteRecurringPaymentResponse = CreateRecurringPaymentResponse;
export const GetRecurringPaymentExecutionsResponse = ApiResponse.extend({
	data: z.array(RecurringPaymentExecution).nullable(),
});
