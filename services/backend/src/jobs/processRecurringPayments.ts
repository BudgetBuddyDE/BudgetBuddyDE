import {isOccurrenceDate} from '@budgetbuddyde/api/recurringPayment';
import {recurringPayments} from '@budgetbuddyde/db/backend';
import {SpanStatusCode} from '@opentelemetry/api';
import {format} from 'date-fns';
import {toZonedTime} from 'date-fns-tz';
import {and, eq, lte} from 'drizzle-orm';
import {config} from '../config';
import {db} from '../db';
import {logger} from '../lib';
import {invalidateUserCaches} from '../middleware/cache.middleware';
import {withSpan} from '../telemetry/tracing';
import {executeScheduledRecurringPayment} from '../utils/executeScheduledRecurringPayment';

const RECURRING_PAYMENT_BATCH_SIZE = 10;
/**
 * Processes all due recurring payments and creates corresponding transactions.
 */
export async function processRecurringPayments() {
  const today = toZonedTime(new Date(), config.jobs.recurringPayments.timezone);
  const scheduledFor = format(today, 'yyyy-MM-dd');
  return withSpan(
    'recurring_payments.run',
    {'job.name': config.jobs.recurringPayments.name, 'job.scheduled_for': scheduledFor},
    async jobSpan => {
      let processedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;
      logger.info('Starting recurring payments processing job...', {
        scheduledFor,
        timezone: config.jobs.recurringPayments.timezone,
      });

      try {
        const duePayments = await withSpan('recurring_payments.discover', {}, async () => {
          const candidatePayments = await db.query.recurringPayments.findMany({
            where: and(eq(recurringPayments.paused, false), lte(recurringPayments.startsOn, scheduledFor)),
          });
          return candidatePayments.filter(payment => isOccurrenceDate(payment, scheduledFor));
        });

        logger.info(`Found ${duePayments.length} recurring payments scheduled for ${scheduledFor}.`, {scheduledFor});

        if (duePayments.length === 0) {
          logger.info('No recurring payments to process. Exiting job.');
          return;
        }

        for (let start = 0; start < duePayments.length; start += RECURRING_PAYMENT_BATCH_SIZE) {
          const batch = duePayments.slice(start, start + RECURRING_PAYMENT_BATCH_SIZE);
          const results = await withSpan('recurring_payments.batch', {'batch.size': batch.length}, async batchSpan => {
            const results = await Promise.allSettled(
              batch.map(payment => executeScheduledRecurringPayment(payment, scheduledFor, today)),
            );
            const failures = results.filter(result => result.status === 'rejected').length;
            batchSpan.setAttribute('batch.failed', failures);
            if (failures > 0) {
              batchSpan.setStatus({code: SpanStatusCode.ERROR});
              batchSpan.addEvent('batch.failed', {'batch.failed': failures});
            }
            return results;
          });
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
            jobSpan.setStatus({code: SpanStatusCode.ERROR});
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
        jobSpan.setStatus({code: SpanStatusCode.ERROR});
        const error = err instanceof Error ? err : new Error(String(err));
        jobSpan.recordException({name: error.name, message: error.name});
        logger.error('Error processing recurring payments:', error);
      } finally {
        jobSpan.setAttributes({
          'job.processed': processedCount,
          'job.skipped': skippedCount,
          'job.failed': failedCount,
        });
      }
    },
  );
}
