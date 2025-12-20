import {z} from 'zod';
import {UserID} from './_Base';
import {Category} from './Category';
import {PaymentMethod} from './PaymentMethod';

// Base model
export const Transaction = z.object({
  id: z.uuid().brand('TransactionID'),
  ownerId: UserID,
  categoryId: Category.shape.id,
  paymentMethodId: PaymentMethod.shape.id,
  processedAt: z.iso.datetime().or(z.date()),
  receiver: z.string(),
  transferAmount: z.number(),
  information: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type TTransaction = z.infer<typeof Transaction>;

export const ExpandedTransaction = Transaction.omit({
  categoryId: true,
  paymentMethodId: true,
}).extend({
  category: Category,
  paymentMethod: PaymentMethod,
});
export type TExpandedTransaction = z.infer<typeof ExpandedTransaction>;

export const CreateOrUpdateTransaction = Transaction.pick({
  categoryId: true,
  paymentMethodId: true,
  processedAt: true,
  receiver: true,
  transferAmount: true,
  information: true,
}).extend({information: Transaction.shape.information.optional()});
export type TCreateOrUpdateTransaction = z.infer<typeof CreateOrUpdateTransaction>;

/**
 * Receiver
 */
export const ReceiverVH = Transaction.pick({
  receiver: true,
});
export type TReceiverVH = z.infer<typeof ReceiverVH>;
