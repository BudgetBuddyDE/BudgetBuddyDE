import {format} from 'date-fns';
import {toZonedTime} from 'date-fns-tz';
import {lte} from 'drizzle-orm';
import {config} from '../config';
import {db} from '../db';
import {logger} from '../lib';
import {createTransactionFromRecurringPayment} from '../utils/createTransactionFromRecurringPayment';

/**
 * Processes all due recurring payments and creates corresponding transactions.
 */
export async function processRecurringPayments() {
  const today = toZonedTime(new Date(), config.jobs.recurringPayments.timezone);
  logger.info('Starting recurring payments processing job...', {
    date: format(today, 'yyyy-MM-dd'),
    timezone: config.jobs.recurringPayments.timezone,
  });

  const duePayments = await db.query.recurringPayments.findMany({
    where(fields, operators) {
      return operators.and(operators.eq(fields.paused, false), lte(fields.nextExecutionAt, today));
    },
  });

  logger.info(`Found ${duePayments.length} recurring payments to process.`);

  try {
    if (duePayments.length === 0) {
      logger.info('No recurring payments to process. Exiting job.');
      return;
    }

    const createdTransactions = await Promise.all(
      duePayments.map(payment => createTransactionFromRecurringPayment(payment, today)),
    );

    logger.info(`Successfully processed ${createdTransactions.length} recurring payments into transactions.`);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Error processing recurring payments:', error);
  }
}
