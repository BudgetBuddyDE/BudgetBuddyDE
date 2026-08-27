import type {TypeOfSchema} from './common';
import type * as schema from './schemas/recurringPayment.schema';

export type TRecurringPayment = TypeOfSchema<typeof schema.RecurringPayment>;
export type TExpandedRecurringPayment = TypeOfSchema<typeof schema.ExpandedRecurringPayment>;
export type TExecutionPlan = TypeOfSchema<typeof schema.ExecutionPlan>;
// export type TCreateRecurringPaymentPayload = TypeOfSchema<
//   typeof schema.CreateRecurringPaymentPayload
// >;
// export type TUpdateRecurringPaymentPayload = TypeOfSchema<
//   typeof schema.UpdateRecurringPaymentPayload
// >;
export type TCreateOrUpdateRecurringPaymentPayload = TypeOfSchema<typeof schema.CreateOrUpdateRecurringPaymentPayload>;
export type TExecuteRecurringPaymentResponse = TypeOfSchema<typeof schema.ExecuteRecurringPaymentResponse>;
export type TRecurringPaymentOccurrence = TypeOfSchema<typeof schema.RecurringPaymentOccurrence>;
export type TGetRecurringPaymentOccurrencesResponse = TypeOfSchema<
  typeof schema.GetRecurringPaymentOccurrencesResponse
>;
