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
import {initWinstonLogger} from './core/winstonLogger';

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

const serviceName = name;
const serviceVersion = version;
const serviceEnvironment = getCurrentRuntime();
const logLevel = getLogLevel();

const winstonLogger = initWinstonLogger(
  {
    level: logLevel,
    environment: serviceEnvironment,
  },
  {service: serviceName, version: serviceVersion, environment: serviceEnvironment, project: 'budgetbuddyde'},
);

export const config: Config = {
  service: name,
  version: version,
  port: getPort(),
  environment: serviceEnvironment,
  log: {
    level: logLevel,
    log(level, msg, args) {
      winstonLogger[level](msg, args);
    },
  },
  db: {
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    redis: {
      url: process.env.REDIS_URL,
      database: process.env.REDIS_DATABASE ? parseInt(process.env.REDIS_DATABASE, 10) : 1,
    },
  },
  cors: {
    origin: isRunningInProd()
      ? [/\.budget-buddy\.de$/, /^(http|https):\/\/localhost(:\d+)?$/]
      : [/^(http|https):\/\/localhost(:\d+)?$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    credentials: true,
  },
};
