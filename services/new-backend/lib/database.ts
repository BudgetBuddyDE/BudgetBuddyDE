import * as authSchema from '@budgetbuddyde/db/auth';
import * as domainSchema from '@budgetbuddyde/db/backend';
import {drizzle} from 'drizzle-orm/node-postgres';
import pg from 'pg';
import {databaseUrl} from './config';
import {logger} from './logger';

const databaseLogger = logger.child({module: 'database'});

let pool: pg.Pool | undefined;
export function getPool() {
  if (!pool) {
    pool = new pg.Pool({connectionString: databaseUrl.parse(process.env.DATABASE_URL), connectionTimeoutMillis: 5000, max: 20});
    pool.on('error', () => databaseLogger.error('Idle PostgreSQL connection failed'));
  }
  return pool;
}

const createDatabase = () => drizzle({client: getPool(), schema: {...domainSchema, ...authSchema}});
let database: ReturnType<typeof createDatabase> | undefined;
export const getDatabase = () => (database ??= createDatabase());
export const closeDatabase = () => pool?.end();
