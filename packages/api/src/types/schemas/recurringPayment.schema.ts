import {z} from 'zod';
import {ApiResponse} from './common.schema';
import {ExpandedTransaction, Transaction} from './transaction.schema';

export const ExecutionPlan = z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']);
export const DateOnly = z.iso.date();

export const RecurringPayment = Transaction.omit({
  processedAt: true,
}).extend({
  paused: z.boolean().default(false),
  executionPlan: ExecutionPlan,
  startsOn: DateOnly,
});

export const ExpandedRecurringPayment = ExpandedTransaction.omit({
  processedAt: true,
}).extend({
  paused: z.boolean().default(false),
  executionPlan: ExecutionPlan,
  startsOn: DateOnly,
});

export const CreateOrUpdateRecurringPaymentPayload = RecurringPayment.pick({
  executionPlan: true,
  startsOn: true,
  paused: true,
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

export const RecurringPaymentOccurrence = z.object({
  scheduledFor: DateOnly,
  recurringPayment: ExpandedRecurringPayment,
});

export const GetRecurringPaymentOccurrencesResponse = ApiResponse.extend({
  data: z.array(RecurringPaymentOccurrence).nullable(),
});
