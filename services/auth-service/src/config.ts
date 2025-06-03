import {
  type LogLevel,
  Logger,
  type Runtime,
  getCurrentRuntime,
  getLogLevel,
  getPort,
  isRunningInProd,
} from '@budgetbuddyde/utils';
import type {CorsOptions} from 'cors';
import 'dotenv/config';
import {type PoolConfig} from 'pg';
import {type RedisClientOptions} from 'redis';

import {name, version} from '../package.json';

export type Config = {
  service: typeof name;
  version: typeof version;
  port: number | string;
  environment: Runtime;
  log: {
    level: LogLevel;
    log?: Logger['log'];
  };
  db: {
    pool: PoolConfig;
    redis?: RedisClientOptions;
  };
  cors: CorsOptions;
};

export const config: Config = {
  service: name,
  version: version,
  port: getPort(),
  environment: getCurrentRuntime(),
  log: {
    level: getLogLevel(),
  },
  db: {
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  },
  cors: {
    origin: isRunningInProd() ? [/\.budget-buddy\.de$/] : [/^(http|https):\/\/localhost(:\d+)?$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    credentials: true,
  },
};
