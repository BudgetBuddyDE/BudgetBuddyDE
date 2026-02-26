import {getLogLevel} from '@budgetbuddyde/logger';
import {getCurrentRuntime, getPort, getTrustedOrigins, isRunningInProd, type Runtime} from '@budgetbuddyde/utils';
import type {CorsOptions} from 'cors';
import LokiTransport from 'winston-loki';
import 'dotenv/config';
import type {Options as RateLimitOptions} from 'express-rate-limit';
import {type Logger, transports} from 'winston';
import {name, version} from '../package.json';
import {HTTPStatusCode} from './models';

export type Config = {
  service: typeof name;
  version: typeof version;
  port: ReturnType<typeof getPort>;
  runtime: Runtime;
  log: Pick<Logger, 'level' | 'transports'> & {
    defaultMeta?: Record<string, string | number | boolean>;
    hideMeta?: boolean;
  };
  cors: CorsOptions;
  rateLimit: Partial<RateLimitOptions>;
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
  port: getPort(9000),
  runtime: SERVICE_RUNTIME,
  log: {
    level: getLogLevel(process.env.LOG_LEVEL),
    defaultMeta: {
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      runtime: SERVICE_RUNTIME,
    },
    hideMeta: process.env.LOG_HIDE_META === 'true',
    transports: [
      ...(SERVICE_RUNTIME === 'production' && Boolean(process.env.LOKI_URL)
        ? [
            new LokiTransport({
              host: process.env.LOKI_URL || 'http://loki:3100',
              // In production, we want to use metadata as labels for better filtering
              useWinstonMetaAsLabels: true,
            }),
          ]
        : []),
      new transports.Console(),
    ],
  },
  cors: {
    origin: isRunningInProd() ? getTrustedOrigins() : [/^(http|https):\/\/localhost(:\d+)?$/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    credentials: true,
  },
  rateLimit: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 300, // 300 requests per window per IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    passOnStoreError: true,
    statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
  },
  jobs: {
    timezone: process.env.TIMEZONE || 'Europe/Berlin',
  },
};
