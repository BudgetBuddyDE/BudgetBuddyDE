import {Pool} from 'pg';
import {ELogCategory} from './middleware';
import {logger} from './core/logger';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL environment variable is not set.');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  logger.info('Connected to the database', {category: ELogCategory.DATABASE});
});

pool.on('error', err => {
  logger.error('Unexpected error on idle client', {category: ELogCategory.DATABASE, stack: err.stack});
});

pool.on('acquire', () => {
  logger.info('Client acquired from the pool', {category: ELogCategory.DATABASE});
});

pool.on('remove', () => {
  logger.info('Client removed from the pool', {category: ELogCategory.DATABASE});
});

export default pool;
