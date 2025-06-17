import {drizzle} from 'drizzle-orm/node-postgres';

import {config} from '../config';
import {dbLogger, pool} from './pool';
import * as schema from './schema';

const drizzleLogger = dbLogger.child({label: 'drizzle'});
export const db = drizzle({
  client: pool,
  schema: schema,
  logger:
    config.log.level === 'debug'
      ? {
          logQuery(query, params) {
            drizzleLogger.debug(`Query "${query}" with params ${params.join(', ')} executed`);
          },
        }
      : undefined,
});
export type DrizzleDatabaseClient = typeof db;
