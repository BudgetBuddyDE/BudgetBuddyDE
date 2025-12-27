import {getCurrentRuntime, getPort, getTrustedOrigins, isRunningInProd, type Runtime} from '@budgetbuddyde/utils';
import type {CorsOptions} from 'cors';
import type {Logger} from 'winston';
import 'dotenv/config';
import {getLogLevel, LogLevel} from '@budgetbuddyde/logger';
import {name, version} from '../package.json';

export type Config = {
  service: typeof name;
  version: typeof version;
  baseUrl: string;
  port: ReturnType<typeof getPort>;
  requestIdHeaderName: string;
  runtime: Runtime;
  log: Pick<Logger, 'level'> & {defaultMeta?: Record<string, string | number | boolean>};
  cors: CorsOptions;
  jobs: {
    timezone: string;
  };
};

const SERVICE_NAME = name;
const SERVICE_VERSION = version;
const SERVICE_RUNTIME = getCurrentRuntime();
const SERVICE_REQUEST_ID_HEADER_NAME = 'x-request-id';

export const config: Config = {
  service: SERVICE_NAME,
  version: SERVICE_VERSION,
  baseUrl: process.env.BASE_URL || 'http://localhost',
  port: getPort(8080),
  requestIdHeaderName: SERVICE_REQUEST_ID_HEADER_NAME,
  runtime: SERVICE_RUNTIME,
  log: {
    level: LogLevel[getLogLevel(process.env.LOG_LEVEL || 'INFO')],
    defaultMeta: {
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      runtime: SERVICE_RUNTIME,
    },
  },
  cors: {
    origin: isRunningInProd() ? getTrustedOrigins() : [/^(http|https):\/\/localhost(:\d+)?$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', SERVICE_REQUEST_ID_HEADER_NAME],
    credentials: true,
  },
  jobs: {
    timezone: process.env.TIMEZONE || 'Europe/Berlin',
  },
};
