import {z} from 'zod';
import {UserID} from './_Base';

// Base model
export const PaymentMethod = z.object({
  id: z.uuid().brand('PaymentMethodID'),
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
}).extend({description: PaymentMethod.shape.description.optional()});
export type TCreateOrUpdatePaymentMethod = z.infer<typeof CreateOrUpdatePaymentMethod>;

// Value-Help
export const PaymentMethodVH = PaymentMethod.pick({
  id: true,
  name: true,
  address: true,
  provider: true,
  description: true,
});
export type TPaymentMethodVH = z.infer<typeof PaymentMethodVH>;
