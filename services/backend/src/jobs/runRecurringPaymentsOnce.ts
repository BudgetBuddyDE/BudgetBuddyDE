import {processRecurringPayments} from './processRecurringPayments';
import {pool} from '../db/pool';
import {logger} from '../lib/logger';

async function main() {
  try {
    await processRecurringPayments();
  } catch (error) {
    logger.error('Failed to run recurring payments job', error instanceof Error ? error : new Error(String(error)));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
