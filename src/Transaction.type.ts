import {z} from 'zod';
import {ZUser} from './User.type';
import {ZCategory} from './Category.type';
import {ZPaymentMethod} from './PaymentMethod.type';
import {ZCreatedAt, ZDate, ZDescription} from './Base.type';

/**
 * TransactionFile
 */

export const ZTransactionFile = z.object({
  uuid: z.string().uuid(),
  // owner: ZUser,
  // transaction: ZTransaction,
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string().max(20, {message: 'Mimetype is too long'}),
  location: z.string().max(255, {message: 'Location is too long'}),
  createdAt: ZCreatedAt,
});
export type TTransactionFile = z.infer<typeof ZTransactionFile>;

export const ZCreateTransactionFilePayload = z.object({
  transactionId: z.number(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string().max(20, {message: 'Mimetype is too long'}),
  fileUrl: z.string().max(255, {message: 'FileURL is too long'}),
});
export type TCreateTransactionFilePayload = z.infer<typeof ZCreateTransactionFilePayload>;

/**
 * Transaction
 */
const ZTransferAmount = z
  .number()
  .or(z.string())
  .transform(val => Number(val));

export const ZTransaction = z.object({
  id: z.number(),
  owner: ZUser,
  category: ZCategory,
  paymentMethod: ZPaymentMethod,
  processedAt: ZDate,
  receiver: z.string(),
  description: ZDescription,
  transferAmount: ZTransferAmount,
  attachedFiles: z.array(ZTransactionFile),
  createdAt: ZCreatedAt,
});
export type TTransaction = z.infer<typeof ZTransaction>;

export const ZCreateTransactionPayload = z.object({
  owner: z.string().uuid(),
  categoryId: z.number(),
  paymentMethodId: z.number(),
  processedAt: ZDate,
  receiver: z.string(),
  description: ZDescription,
  transferAmount: ZTransferAmount,
});
export type TCreateTransactionPayload = z.infer<typeof ZCreateTransactionPayload>;

export const ZUpdateTransactionPayload = z.object({
  transactionId: z.number(),
  categoryId: z.number(),
  paymentMethodId: z.number(),
  processedAt: ZDate,
  receiver: z.string(),
  description: ZDescription,
  transferAmount: ZTransferAmount,
});
export type TUpdateTransactionPayload = z.infer<typeof ZUpdateTransactionPayload>;

export const ZDeleteTransactionPayload = z.array(
  z.object({
    transactionId: z.number(),
  }),
);
export type TDeleteTransactionPayload = z.infer<typeof ZDeleteTransactionPayload>;
export const ZDeleteTransactionResponsePayload = z.object({
  success: z.array(ZTransaction),
  failed: ZDeleteTransactionPayload,
});
export type TDeleteTransactionResponsePayload = z.infer<typeof ZDeleteTransactionResponsePayload>;

export const ZMonthlyBalance = z.object({
  month: ZDate,
  income: z.number(),
  expenses: z.number(),
  balance: z.number(),
});
export type TMonthlyBalance = z.infer<typeof ZMonthlyBalance>;