import {recurringPayments, transactions} from '@budgetbuddyde/db/backend';
import {eq} from 'drizzle-orm';
import {db} from '../db';
import {nextRecurringDateAfter, type RecurringInterval} from './recurringDate';

type TPaymentMethod = {
  id: string;
  ownerId: string;
  categoryId: string;
  paymentMethodId: string;
  receiver: string;
  information: string | null;
  transferAmount: number;
  interval: RecurringInterval;
  nextExecutionAt: Date;
};

/**
 * Creates a transaction from a single recurring payment record.
 * @param payment - The recurring payment to execute
 * @param processedAt - The date to use as processedAt (defaults to now)
 * @returns The created transaction record
 */
export async function createTransactionFromRecurringPayment(payment: TPaymentMethod, processedAt: Date = new Date()) {
  return db.transaction(async tx => {
    const [createdTransaction] = await tx
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
    await tx
      .update(recurringPayments)
      .set({nextExecutionAt: nextRecurringDateAfter(payment.nextExecutionAt, payment.interval, processedAt)})
      .where(eq(recurringPayments.id, payment.id));
    return createdTransaction;
  });
}
