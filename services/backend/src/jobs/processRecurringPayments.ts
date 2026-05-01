import {calculateExecutionsForPeriod} from '@budgetbuddyde/api/recurringPayment';
import {transactions} from '@budgetbuddyde/db/backend';
import {db} from '../db';
import {logger} from '../lib';

/**
 * Processes all due recurring payments and creates corresponding transactions.
 *
 * Execution logic per plan (using "today" in the configured timezone):
 * - **daily**:     always due
 * - **weekly**:    due when ISO weekday matches `execute_at`
 * - **bi-weekly**: due when ISO weekday matches `execute_at` AND the ISO-week
 *                  parity matches the creation-date parity
 * - **monthly**:   due when day-of-month matches `execute_at` (with
 *                  end-of-month clamping for months shorter than `execute_at`)
 * - **quarterly**: same as monthly, restricted to months in the same quarter
 *                  cycle as `created_at`
 * - **yearly**:    same as monthly, restricted to the anchor month from
 *                  `created_at`
 *
 * Paused payments are always skipped.
 */
export async function processRecurringPayments() {
  logger.info('Starting recurring payments processing job...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allActive = await db.query.recurringPayments.findMany({
    where(fields, operators) {
      return operators.eq(fields.paused, false);
    },
  });

  logger.info(`Found ${allActive.length} non-paused recurring payments to evaluate.`);

  const duePayments = allActive.filter(payment => {
    const executions = calculateExecutionsForPeriod(
      {
        executeAt: payment.executeAt,
        executionPlan: payment.executionPlan,
        createdAt: payment.createdAt.toISOString(),
      },
      today,
      today,
    );
    return executions.length > 0;
  });

  logger.info(`${duePayments.length} recurring payments are due today.`);

  try {
    if (duePayments.length === 0) {
      logger.info('No recurring payments to process. Exiting job.');
      return;
    }

    const createdTransactions = await db
      .insert(transactions)
      .values(
        duePayments.map(payment => ({
          ownerId: payment.ownerId,
          categoryId: payment.categoryId,
          paymentMethodId: payment.paymentMethodId,
          processedAt: today,
          receiver: payment.receiver,
          transferAmount: payment.transferAmount,
          information: payment.information,
        })),
      )
      .returning();

    logger.info(`Successfully processed ${createdTransactions.length} recurring payments into transactions.`);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Error processing recurring payments:', error);
  }
}
