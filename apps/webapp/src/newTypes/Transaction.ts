import {z} from 'zod';

import {Category} from './Category';
import {PaymentMethod} from './PaymentMethod';
import {CdsDate, IdAspect, ManagedAspect, OptionalIdAspect} from './_Aspects';
import {DescriptionType, ODataContextAspect, OwnerAspect} from './_Base';

// Base model
export const Transaction = z.object({
  ...IdAspect.shape,
  toCategory_ID: Category.shape.ID,
  toPaymentMethod_ID: PaymentMethod.shape.ID,
  processedAt: CdsDate,
  receiver: z.string().min(1).max(255),
  transferAmount: z.number(),
  information: DescriptionType,
  ...OwnerAspect.shape,
  ...ManagedAspect.shape,
});
export type TTransaction = z.infer<typeof Transaction>;

export const CreateOrUpdateTransaction = Transaction.pick({
  toCategory_ID: true,
  toPaymentMethod_ID: true,
  processedAt: true,
  receiver: true,
  transferAmount: true,
  information: true,
}).merge(OptionalIdAspect);
export type TCreateOrUpdateTransaction = z.infer<typeof CreateOrUpdateTransaction>;

// Response from OData
export const TransactionResponse = Transaction.extend(ODataContextAspect.shape);
export type TTransactionResponse = z.infer<typeof TransactionResponse>;
