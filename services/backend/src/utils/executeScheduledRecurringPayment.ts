import {recurringPaymentExecutions, recurringPayments, transactions} from '@budgetbuddyde/db/backend';
import {and, eq, isNull} from 'drizzle-orm';
import {db} from '../db';
import {createPaymentSnapshot, hashPaymentSnapshot} from './recurringPaymentSnapshot';

type TScheduledPayment = Pick<
  typeof recurringPayments.$inferSelect,
  'id' | 'ownerId' | 'categoryId' | 'paymentMethodId' | 'receiver' | 'information' | 'transferAmount'
>;

type TExecutionResult = {status: 'created'; transaction: typeof transactions.$inferSelect} | {status: 'skipped'};

/** Books a scheduled occurrence atomically; manual extra bookings do not use this path. */
export async function executeScheduledRecurringPayment(
  payment: TScheduledPayment,
  scheduledFor: string,
  processedAt: Date,
): Promise<TExecutionResult> {
  return db.transaction(async tx => {
    const content = createPaymentSnapshot(payment, scheduledFor);
    const contentHash = hashPaymentSnapshot(content);
    // Historical executions without a snapshot cannot safely be compared; keep their protection.
    const [legacyExecution] = await tx
      .select({scheduledFor: recurringPaymentExecutions.scheduledFor})
      .from(recurringPaymentExecutions)
      .where(
        and(
          eq(recurringPaymentExecutions.ownerId, payment.ownerId),
          eq(recurringPaymentExecutions.recurringPaymentId, payment.id),
          eq(recurringPaymentExecutions.scheduledFor, scheduledFor),
          isNull(recurringPaymentExecutions.content),
        ),
      )
      .limit(1);
    if (legacyExecution) return {status: 'skipped'};

    const [reservation] = await tx
      .insert(recurringPaymentExecutions)
      .values({ownerId: payment.ownerId, recurringPaymentId: payment.id, scheduledFor, content, contentHash})
      .onConflictDoNothing({
        target: [
          recurringPaymentExecutions.ownerId,
          recurringPaymentExecutions.recurringPaymentId,
          recurringPaymentExecutions.scheduledFor,
          recurringPaymentExecutions.contentHash,
        ],
      })
      .returning({scheduledFor: recurringPaymentExecutions.scheduledFor});

    if (!reservation) return {status: 'skipped'};

    const [transaction] = await tx
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

    if (!transaction) throw new Error('No transaction created for recurring payment occurrence');

    const [execution] = await tx
      .update(recurringPaymentExecutions)
      .set({transactionId: transaction.id})
      .where(
        and(
          eq(recurringPaymentExecutions.ownerId, payment.ownerId),
          eq(recurringPaymentExecutions.recurringPaymentId, payment.id),
          eq(recurringPaymentExecutions.scheduledFor, scheduledFor),
          eq(recurringPaymentExecutions.contentHash, contentHash),
        ),
      )
      .returning({transactionId: recurringPaymentExecutions.transactionId});

    if (!execution) throw new Error('No execution linked to recurring payment transaction');

    return {status: 'created', transaction};
  });
}
