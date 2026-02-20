import {transactions} from '@budgetbuddyde/db/backend';
import {db} from '../db';
import {logger} from '../lib';

/**
 * Processes all due recurring payments and creates corresponding transactions.
 */
export async function processRecurringPayments() {
  logger.info('Starting recurring payments processing job...');
  const today = new Date();

  let duePayments = await db.query.recurringPayments.findMany({
    where(fields, operators) {
      return operators.and(operators.eq(fields.paused, false), operators.eq(fields.executeAt, today.getDate()));
    },
  });

  logger.info(`Found ${duePayments.length} recurring payments to process.`);

  // Determine how many days are in the current month
  const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  if (daysInCurrentMonth < 31 && today.getDate() === daysInCurrentMonth) {
    logger.info(
      'Current month has less than 31 days, checking for payments scheduled on days that do not exist this month.',
      {daysInCurrentMonth},
    );
    const extraPayments = await db.query.recurringPayments.findMany({
      // Check if today is the last day of the month
      // If this is the case, we want to process any payments scheduled for days that do not exist in this month
      where(fields, operators) {
        return operators.and(operators.eq(fields.paused, false), operators.gt(fields.executeAt, today.getDate()));
      },
    });

    logger.info(
      `Found ${extraPayments.length} additional recurring payments to process for non-existing days in this month.`,
    );
    extraPayments.forEach(payment => {
      logger.debug(
        `Including payment ID ${payment.id} scheduled for day ${payment.executeAt} in the current processing batch.`,
        {
          recurringPaymentId: payment.id,
          scheduledDay: payment.executeAt,
        },
      );
    });
    duePayments = duePayments.concat(extraPayments);
  }

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
