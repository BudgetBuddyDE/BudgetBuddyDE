import * as authSchema from '@budgetbuddyde/db/auth';
import {drizzle, type NodePgDatabase} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';
import {getAuthConfig} from './config';

type AuthDatabase = NodePgDatabase<typeof authSchema>;

type AuthDatabaseState = {
  pool: Pool;
  db: AuthDatabase;
};

// Reuse the pool across HMR reloads in development to avoid exhausting connections.
const globalForAuth = globalThis as unknown as {__budgetbuddyAuthDatabase?: AuthDatabaseState};

function createAuthDatabase(): AuthDatabaseState {
  const pool = new Pool({
    connectionString: getAuthConfig().databaseUrl,
    connectionTimeoutMillis: 5000,
    max: 10,
  });

  return {
    pool,
    db: drizzle({client: pool, schema: authSchema}),
  };
}

/** Returns the shared PostgreSQL connection for authentication data, creating it on first use. */
export function getAuthDatabase(): AuthDatabaseState {
  if (!globalForAuth.__budgetbuddyAuthDatabase) {
    globalForAuth.__budgetbuddyAuthDatabase = createAuthDatabase();
  }
  return globalForAuth.__budgetbuddyAuthDatabase;
}
