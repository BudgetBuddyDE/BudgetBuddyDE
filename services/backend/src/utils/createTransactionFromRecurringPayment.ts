import type {TRecurringPayment} from '@budgetbuddyde/api/recurringPayment';
import {transactions} from '@budgetbuddyde/db/backend';
import {db} from '../db';

/**
 * Creates a transaction from a single recurring payment record.
 * @param payment - The recurring payment to execute
 * @param processedAt - The date to use as processedAt (defaults to now)
 * @returns The created transaction record
 */
export async function createTransactionFromRecurringPayment(
  payment: Pick<
    TRecurringPayment,
    'ownerId',
    'categoryId',
    'paymentMethodId',
    'receiver',
    'information',
    'transferAmount'
  >,
  processedAt: Date = new Date(),
) {
  const [createdTransaction] = await db
    .insert(transactions)
    .values({
      ownerId: payment.ownerId,
      categoryId: payment.categoryId,
      paymentMethodId: payment.paymentMethodId,
      processedAt,
      receiver: payment.receiver,
      transferAmount: payment.transferAmount,
      information: payment.information,
    })
    .returning();

  return createdTransaction;
}
