import {
  type LogClientOptions,
  LogLevel,
  type Runtime,
  getCurrentRuntime,
  getPort,
  isRunningInProd,
} from '@budgetbuddyde/utils';
import {getLogLevel} from '@budgetbuddyde/utils/lib/getLogLevel';
import {type CorsOptions} from 'cors';
import 'dotenv/config';

import {name, version} from '../package.json';
import {initWinstonLogger} from './core/logger.winston';

export type Config = {
  service: typeof name;
  version: typeof version;
  baseUrl: string;
  port: ReturnType<typeof getPort>;
  runtime: Runtime;
  log: Pick<LogClientOptions, 'level' | 'log' | 'scope'>;
  cors: CorsOptions;
  jobs: {
    timezone: string;
  };
};

const SERVICE_NAME = name;
const SERVICE_VERSION = version;
const SERVICE_RUNTIME = getCurrentRuntime();
const LOG_LEVEL = getLogLevel();

const logger = initWinstonLogger(
  {
    level: LOG_LEVEL,
  },
  {
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    runtime: SERVICE_RUNTIME,
  },
);

export const config: Config = {
  service: SERVICE_NAME,
  version: SERVICE_VERSION,
  baseUrl: process.env.BASE_URL || 'http://localhost',
  port: getPort(),
  runtime: SERVICE_RUNTIME,
  log: {
    scope: `${SERVICE_NAME}:${SERVICE_VERSION}`,
    level: LOG_LEVEL,
    log: (level, msg, ...meta) => {
      switch (level) {
        case LogLevel.DEBUG:
          return logger.debug({message: msg, labels: {...meta}});
        case LogLevel.INFO:
          return logger.info({message: msg, labels: {...meta}});
        case LogLevel.WARN:
          return logger.warn({message: msg, labels: {...meta}});
        case LogLevel.FATAL:
        case LogLevel.ERROR:
          return logger.error({message: msg, labels: {...meta}});
        case LogLevel.SILENT:
          return;
      }
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
  jobs: {
    timezone: process.env.TIMEZONE || 'Europe/Berlin',
  },
};
