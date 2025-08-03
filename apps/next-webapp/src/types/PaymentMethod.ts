import {z} from 'zod';

import {IdAspect, ManagedAspect, OptionalIdAspect} from './_Aspects';
import {DescriptionType, ODataContextAspect, OwnerAspect} from './_Base';

// Base model
export const PaymentMethod = z.object({
  ...IdAspect.shape,
  name: z.string().nonempty().min(1).max(80),
  provider: z.string().nonempty().min(1).max(100),
  address: z.string().nonempty().min(1).max(100),
  description: DescriptionType,
  ...OwnerAspect.shape,
  ...ManagedAspect.shape,
});
export type TPaymentMethod = z.infer<typeof PaymentMethod>;

export const CreateOrUpdatePaymentMethod = PaymentMethod.pick({
  name: true,
  provider: true,
  address: true,
  description: true,
}).merge(OptionalIdAspect);
export type TCreateOrUpdatePaymentMethod = z.infer<typeof CreateOrUpdatePaymentMethod>;

// Response from OData
export const PaymentMethodResponse = PaymentMethod.extend(ODataContextAspect.shape);
export type TPaymentMethodResponse = z.infer<typeof PaymentMethodResponse>;

// Value-Help
export const PaymentMethod_VH = PaymentMethod.pick({
  ID: true,
  name: true,
  address: true,
  provider: true,
  description: true,
});
export type TPaymentMethod_VH = z.infer<typeof PaymentMethod_VH>;
