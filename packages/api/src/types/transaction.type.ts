import type { TypeOfSchema } from "./common";
import type * as schema from "./schemas/transaction.schema";

export type TTransaction = TypeOfSchema<typeof schema.Transaction>;
export type TExpandedTransaction = TypeOfSchema<
	typeof schema.ExpandedTransaction
>;
// export type TCreateTransactionPayload = TypeOfSchema<
//   typeof schema.CreateTransactionPayload
// >;
// export type TUpdateTransactionPayload = TypeOfSchema<
//   typeof schema.UpdateTransactionPayload
// >;
export type TCreateOrUpdateTransactionPayload = TypeOfSchema<
	typeof schema.CreateOrUpdateTransactionPayload
>;
export type TReceiverVH = TypeOfSchema<typeof schema.ReceiverVH>;
