import {z} from 'zod';
import {ApiResponse} from './common.schema';
import {ExpandedTransaction, Transaction} from './transaction.schema';
export const RecurringInterval = z.enum(['monthly', 'quarterly', 'yearly']);

export const RecurringPayment = Transaction.omit({
  processedAt: true,
}).extend({
  paused: z.boolean().default(false),
  executeAt: z.number().min(1).max(31),
  interval: RecurringInterval.default('monthly'),
  expiresAt: z.coerce.date().nullable().default(null),
});

export const ExpandedRecurringPayment = ExpandedTransaction.omit({
  processedAt: true,
}).extend({
  paused: z.boolean().default(false),
  executeAt: z.number().min(1).max(31),
  interval: RecurringInterval.default('monthly'),
  expiresAt: z.coerce.date().nullable().default(null),
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
  interval: true,
  paused: true,
  expiresAt: true,
  categoryId: true,
  paymentMethodId: true,
  receiver: true,
  transferAmount: true,
  information: true,
}).extend({
  information: RecurringPayment.shape.information.optional(),
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
export const ExecuteRecurringPaymentResponse = ApiResponse.extend({
  data: Transaction.nullable(),
});
