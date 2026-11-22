import * as authSchema from '@budgetbuddyde/db/auth';
import * as domainSchema from '@budgetbuddyde/db/backend';
import {drizzle} from 'drizzle-orm/node-postgres';
import pg from 'pg';
import {config} from './config';

export const pool = new pg.Pool({connectionString: config.DATABASE_URL, connectionTimeoutMillis: 5000, max: 20});
pool.on('error', () => console.error('Idle PostgreSQL connection failed'));
export const db = drizzle({client: pool, schema: {...domainSchema, ...authSchema}});
