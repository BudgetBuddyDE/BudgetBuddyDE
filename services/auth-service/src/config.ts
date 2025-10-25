import {getLogLevel, type LogClientOptions} from '@budgetbuddyde/logger';
import {getCurrentRuntime, getPort, isRunningInProd, type Runtime} from '@budgetbuddyde/utils';
import type {CorsOptions} from 'cors';
import 'dotenv/config';

import {name, version} from '../package.json';

export type Config = {
  service: typeof name;
  version: typeof version;
  baseUrl: string;
  port: ReturnType<typeof getPort>;
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

export const config: Config = {
  service: SERVICE_NAME,
  version: SERVICE_VERSION,
  baseUrl: process.env.BASE_URL || 'http://localhost',
  port: getPort(),
  runtime: SERVICE_RUNTIME,
  log: {
    label: `${SERVICE_NAME}:${SERVICE_VERSION}`,
    level: getLogLevel(process.env.LOG_LEVEL || 'INFO'),
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
