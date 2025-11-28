import {getLogLevel, type LogClientOptions} from '@budgetbuddyde/logger';
import {getCurrentRuntime, getPort, getTrustedOrigins, isRunningInProd, type Runtime} from '@budgetbuddyde/utils';
import type {CorsOptions} from 'cors';
import 'dotenv/config';
import {name, version} from '../package.json';

export type Config = {
  service: typeof name;
  version: typeof version;
  port: ReturnType<typeof getPort>;
  requestIdHeaderName: string;
  runtime: Runtime;
  log: Pick<LogClientOptions, 'label' | 'level'>;
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
  port: getPort(9000),
  requestIdHeaderName: SERVICE_REQUEST_ID_HEADER_NAME,
  runtime: SERVICE_RUNTIME,
  log: {
    label: `${SERVICE_NAME}:${SERVICE_VERSION}`,
    level: getLogLevel(process.env.LOG_LEVEL || 'INFO'),
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
