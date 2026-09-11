import {isOccurrenceDate} from '@budgetbuddyde/api/recurringPayment';
import {recurringPayments} from '@budgetbuddyde/db/backend';
import {format} from 'date-fns';
import {toZonedTime} from 'date-fns-tz';
import {and, eq, lte} from 'drizzle-orm';
import {config} from '../config';
import {db} from '../db';
import {logger} from '../lib';
import {invalidateUserCaches} from '../middleware/cache.middleware';
import {createTransactionFromRecurringPayment} from '../utils/createTransactionFromRecurringPayment';

const RECURRING_PAYMENT_BATCH_SIZE = 10;

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

  try {
    const candidatePayments = await db.query.recurringPayments.findMany({
      where: and(eq(recurringPayments.paused, false), lte(recurringPayments.startsOn, scheduledFor)),
    });
    const duePayments = candidatePayments.filter(payment => isOccurrenceDate(payment, scheduledFor));

    logger.info(`Found ${duePayments.length} recurring payments scheduled for ${scheduledFor}.`, {scheduledFor});

    if (duePayments.length === 0) {
      logger.info('No recurring payments to process. Exiting job.');
      return;
    }

    let processedCount = 0;
    let failedCount = 0;
    for (let start = 0; start < duePayments.length; start += RECURRING_PAYMENT_BATCH_SIZE) {
      const batch = duePayments.slice(start, start + RECURRING_PAYMENT_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(payment => createTransactionFromRecurringPayment(payment, today)),
      );
      const affectedUserIds = new Set<string>();

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          processedCount += 1;
          affectedUserIds.add(batch[index].ownerId);
          return;
        }

        failedCount += 1;
        const error = result.reason instanceof Error ? result.reason : new Error(String(result.reason));
        logger.error('Failed to process recurring payment', error, {
          recurringPaymentId: batch[index].id,
          scheduledFor,
        });
      });

      await Promise.all(
        [...affectedUserIds].map(userId =>
          invalidateUserCaches(userId, ['/api/transaction', '/api/budget', '/api/insights']),
        ),
      );
    }

    logger.info(
      `Processed ${processedCount} recurring payments scheduled for ${scheduledFor}; ${failedCount} failed.`,
      {
        scheduledFor,
        processedCount,
        failedCount,
      },
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Error processing recurring payments:', error);
  }
}
