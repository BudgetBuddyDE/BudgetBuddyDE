import { z } from "zod";
import { ApiResponse, UserID } from "./common.schema";

export const PaymentMethod = z.object({
	id: z.uuid().brand("PaymentMethodID"),
	ownerId: UserID,
	name: z.string(),
	provider: z.string().nonempty().min(1).max(100),
	address: z.string().nonempty().min(1).max(100),
	description: z.string().nullable(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

// export const CreatePaymentMethodPayload = PaymentMethod.pick({
// 	name: true,
// 	provider: true,
// 	address: true,
// 	description: true,
// });

// export const UpdatePaymentMethodPayload = z.object({
// 	name: PaymentMethod.shape.name.optional(),
// 	provider: PaymentMethod.shape.provider.optional(),
// 	address: PaymentMethod.shape.address.optional(),
// 	description: PaymentMethod.shape.description.optional(),
// });

export const CreateOrUpdatePaymentMethodPayload = PaymentMethod.pick({
	name: true,
	provider: true,
	address: true,
	description: true,
}).extend({
	description: PaymentMethod.shape.description.optional(),
});

export const PaymentMethodVH = PaymentMethod.pick({
	id: true,
	name: true,
	address: true,
	provider: true,
	description: true,
});

export const GetAllPaymentMethodsResponse = ApiResponse.extend({
	data: z.array(PaymentMethod).nullable(),
});
export const GetPaymentMethodResponse = ApiResponse.extend({
	data: PaymentMethod.nullable(),
});
export const CreatePaymentMethodResponse = ApiResponse.extend({
	data: z.array(PaymentMethod).nullable(),
});
export const UpdatePaymentMethodResponse = CreatePaymentMethodResponse;
export const DeletePaymentMethodResponse = CreatePaymentMethodResponse;
export const MergePaymentMethodsResponse = ApiResponse.extend({
	data: z.object({
		source: z.array(PaymentMethod.shape.id).transform((ids) => new Set(ids)),
		target: PaymentMethod.shape.id,
	}),
});
