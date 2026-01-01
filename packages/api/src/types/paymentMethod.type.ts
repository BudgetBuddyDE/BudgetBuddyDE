import type { TypeOfSchema } from "./common";
import type * as schema from "./schemas/paymentMethod.schema";

export type TPaymentMethod = TypeOfSchema<typeof schema.PaymentMethod>;
// export type TCreatePaymentMethodPayload = TypeOfSchema<
// 	typeof schema.CreatePaymentMethodPayload
// >;
// export type TUpdatePaymentMethodPayload = TypeOfSchema<
// 	typeof schema.UpdatePaymentMethodPayload
// >;
export type TCreateOrUpdatePaymentMethodPayload = TypeOfSchema<
	typeof schema.CreateOrUpdatePaymentMethodPayload
>;
export type TPaymentMethodVH = TypeOfSchema<typeof schema.PaymentMethodVH>;
