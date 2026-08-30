import {BackendConfig} from '@budgetbuddyde/core/config/BackendConfig';
import {EnvironmentVariable} from '@budgetbuddyde/core/environment/EnvironmentVariable';
import {getLogLevel} from '@budgetbuddyde/logger';
import {getCurrentRuntime, getPort, getTrustedOrigins, isRunningInProd} from '@budgetbuddyde/utils';
import type {CorsOptions} from 'cors';
import 'dotenv/config';
import type {Options as RateLimitOptions} from 'express-rate-limit';
import {type Logger, transports} from 'winston';
import LokiTransport from 'winston-loki';
import {name, version} from '../package.json';
import {HTTPStatusCode} from './models';

export type Config = BackendConfig & {
  baseUrl: string;
  database: {
    connectionString: string;
  };
  redis: {
    url: string;
    database: number;
  };
  email: {
    resendApiKey: string;
  };
  log: Pick<Logger, 'level' | 'transports'> & {
    defaultMeta?: Record<string, string | number | boolean>;
    hideMeta?: boolean;
  };
  cors: CorsOptions;
  rateLimit: Partial<RateLimitOptions>;
  exportRateLimit: {
    keyPrefix: string;
    options: Partial<RateLimitOptions>;
  };
  jobs: {
    timezone: string;
  };
};

const SERVICE_NAME = name;
const SERVICE_VERSION = version;
const SERVICE_RUNTIME = getCurrentRuntime();

export const config: Config = Object.assign(
  new BackendConfig({
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    port: getPort(8080),
    runtime: SERVICE_RUNTIME,
  }),
  {
    baseUrl: process.env.BASE_URL || 'http://localhost',
    database: {
      connectionString: new EnvironmentVariable('DATABASE_URL').get(),
    },
    redis: {
      url: new EnvironmentVariable('REDIS_URL').get(),
      database: Number(process.env.REDIS_DB) || 0,
    },
    email: {
      resendApiKey: new EnvironmentVariable('RESEND_API_KEY').get(),
    },
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
      limit: 500, // 500 requests per window per IP
      standardHeaders: 'draft-7' as const,
      legacyHeaders: false,
      passOnStoreError: true,
      statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
    },
    exportRateLimit: {
      keyPrefix: `rate-limit:${SERVICE_NAME}:export:`,
      options: {
        windowMs: 15 * 60 * 1000,
        limit: 2,
        standardHeaders: 'draft-7' as const,
        legacyHeaders: false,
        passOnStoreError: false,
        statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
      },
    },
    jobs: {
      timezone: process.env.TIMEZONE || 'Europe/Berlin',
    },
  },
);
