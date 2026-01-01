import type { TypeOfSchema } from "./common";
import type * as schema from "./schemas/recurringPayment.schema";

export type TRecurringPayment = TypeOfSchema<typeof schema.RecurringPayment>;
export type TExpandedRecurringPayment = TypeOfSchema<
	typeof schema.ExpandedRecurringPayment
>;
// export type TCreateRecurringPaymentPayload = TypeOfSchema<
//   typeof schema.CreateRecurringPaymentPayload
// >;
// export type TUpdateRecurringPaymentPayload = TypeOfSchema<
//   typeof schema.UpdateRecurringPaymentPayload
// >;
export type TCreateOrUpdateRecurringPaymentPayload = TypeOfSchema<
	typeof schema.CreateOrUpdateRecurringPaymentPayload
>;
