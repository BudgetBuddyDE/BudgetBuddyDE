import { z } from "zod";
import { ODataContextAspect, ODataCountAspect, UserID } from "./_Base";

// Base model
export const PaymentMethod = z.object({
	id: z.uuid().brand("CategoryID"),
	ownerId: UserID,
	name: z.string(),
	provider: z.string().nonempty().min(1).max(100),
	address: z.string().nonempty().min(1).max(100),
	description: z.string().nullable(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type TPaymentMethod = z.infer<typeof PaymentMethod>;

export const CreateOrUpdatePaymentMethod = PaymentMethod.pick({
	name: true,
	provider: true,
	address: true,
	description: true,
});
export type TCreateOrUpdatePaymentMethod = z.infer<
	typeof CreateOrUpdatePaymentMethod
>;

/**
 * PaymentMethods with Count
 */
export const PaymentMethodsWithCount = z.object({
	...ODataContextAspect.shape,
	...ODataCountAspect.shape,
	value: z.array(PaymentMethod),
});
/**
 * PaymentMethods with Count
 */
export type TPaymentMethodsWithCount = z.infer<typeof PaymentMethodsWithCount>;

// Value-Help
export const PaymentMethodVH = PaymentMethod.pick({
	id: true,
	name: true,
	address: true,
	provider: true,
	description: true,
});
export type TPaymentMethodVH = z.infer<typeof PaymentMethodVH>;
