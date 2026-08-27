import {isOccurrenceDate} from '@budgetbuddyde/api/recurringPayment';
import {recurringPayments} from '@budgetbuddyde/db/backend';
import {format} from 'date-fns';
import {toZonedTime} from 'date-fns-tz';
import {and, eq, lte} from 'drizzle-orm';
import {config} from '../config';
import {db} from '../db';
import {logger} from '../lib';
import {createTransactionFromRecurringPayment} from '../utils/createTransactionFromRecurringPayment';

/**
 * Processes all due recurring payments and creates corresponding transactions.
 */
export async function processRecurringPayments() {
  const today = toZonedTime(new Date(), config.jobs.recurringPayments.timezone);
  const scheduledFor = format(today, 'yyyy-MM-dd');
  logger.info('Starting recurring payments processing job...', {
    scheduledFor,
    timezone: config.jobs.recurringPayments.timezone,
  });

  const candidatePayments = await db.query.recurringPayments.findMany({
    where: and(eq(recurringPayments.paused, false), lte(recurringPayments.startsOn, scheduledFor)),
  });
  const duePayments = candidatePayments.filter(payment => isOccurrenceDate(payment, scheduledFor));

  logger.info(`Found ${duePayments.length} recurring payments scheduled for ${scheduledFor}.`, {scheduledFor});

  try {
    if (duePayments.length === 0) {
      logger.info('No recurring payments to process. Exiting job.');
      return;
    }

    const createdTransactions = await Promise.all(
      duePayments.map(payment => createTransactionFromRecurringPayment(payment, today)),
    );

    logger.info(
      `Successfully processed ${createdTransactions.length} recurring payments scheduled for ${scheduledFor}.`,
      {
        scheduledFor,
      },
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Error processing recurring payments:', error);
  }
}
