import {isOccurrenceDate} from '@budgetbuddyde/api/recurringPayment';
import {recurringPaymentExecutions, recurringPayments} from '@budgetbuddyde/db/backend';
import {format} from 'date-fns';
import {toZonedTime} from 'date-fns-tz';
import {and, eq, lte} from 'drizzle-orm';
import {config} from '../config';
import {db} from '../db';
import {logger} from '../lib';
import {invalidateUserCaches} from '../middleware/cache.middleware';
import {executeScheduledRecurringPayment} from '../utils/executeScheduledRecurringPayment';

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
    const executions = await db
      .select({
        ownerId: recurringPaymentExecutions.ownerId,
        recurringPaymentId: recurringPaymentExecutions.recurringPaymentId,
      })
      .from(recurringPaymentExecutions)
      .where(eq(recurringPaymentExecutions.scheduledFor, scheduledFor));
    const executedPayments = new Set(
      executions.map(execution => `${execution.ownerId}:${execution.recurringPaymentId}`),
    );
    const paymentsToProcess = duePayments.filter(payment => !executedPayments.has(`${payment.ownerId}:${payment.id}`));
    const alreadyExecutedCount = duePayments.length - paymentsToProcess.length;

    logger.info(`Found ${duePayments.length} recurring payments scheduled for ${scheduledFor}.`, {scheduledFor});

    if (paymentsToProcess.length === 0) {
      if (alreadyExecutedCount > 0) {
        logger.info(`Skipped ${alreadyExecutedCount} recurring payments already executed for ${scheduledFor}.`, {
          scheduledFor,
          skippedCount: alreadyExecutedCount,
        });
        return;
      }
      logger.info('No recurring payments to process. Exiting job.');
      return;
    }

    let processedCount = 0;
    let skippedCount = alreadyExecutedCount;
    let failedCount = 0;
    for (let start = 0; start < paymentsToProcess.length; start += RECURRING_PAYMENT_BATCH_SIZE) {
      const batch = paymentsToProcess.slice(start, start + RECURRING_PAYMENT_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(payment => executeScheduledRecurringPayment(payment, scheduledFor, today)),
      );
      const affectedUserIds = new Set<string>();

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.status === 'skipped') {
            skippedCount += 1;
            logger.debug('Recurring payment occurrence already executed; skipping', {
              recurringPaymentId: batch[index].id,
              scheduledFor,
            });
            return;
          }
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
      `Processed ${processedCount} recurring payments scheduled for ${scheduledFor}; ${skippedCount} skipped; ${failedCount} failed.`,
      {
        scheduledFor,
        processedCount,
        skippedCount,
        failedCount,
      },
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Error processing recurring payments:', error);
  }
}
