import 'dotenv/config';
import pg from 'pg';

import {logger} from './core/logger';

const {Pool} = pg;
const dbLogger = logger.child({label: 'pool'});
export const pool = new Pool({
  connectionString: process.env.PG_URL as string,
  connectionTimeoutMillis: 5000,
  max: 20,
});

/**
 * Checks the connection to the database.
 *
 * This function attempts to connect to the database using the connection pool.
 * If the connection is successful, it logs an informational message and releases the client.
 * If the connection fails, it logs an error message.
 *
 * @returns {Promise<boolean>} A promise that resolves to `true` if the connection is successful, or `false` if it fails.
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    dbLogger.info('Connection to database established');
    client.release();
    return true;
  } catch (err) {
    dbLogger.error('Connection to database failed', err);
    return false;
  }
}
