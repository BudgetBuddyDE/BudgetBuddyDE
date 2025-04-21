import {type Logger, getLogLevel} from '@budgetbuddyde/utils';
import {type CorsOptions} from 'cors';
import 'dotenv/config';
import {type PoolConfig} from 'pg';

import {name, version} from '../package.json';

export type Config = {
  service: typeof name;
  version: typeof version;
  port: number | string;
  environment: string;
  log: {
    level: Logger['level'];
    log?: Logger['log'];
  };
  db: {
    pool: PoolConfig;
  };
  cors: CorsOptions;
};

export const config: Config = {
  service: name,
  version: version,
  port: Number(process.env.PORT) || 3000,
  environment: process.env.NODE_ENV || 'development',
  db: {
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  },
  log: {
    level: getLogLevel(),
  },
  cors: {
    origin: process.env.NODE_ENV === 'production' ? [/\.budget-buddy\.de$/] : [/\.localhost\$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-Request-Id', 'X-Served-By'],
    credentials: true,
  },
};
