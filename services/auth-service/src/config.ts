import {BackendConfig} from '@budgetbuddyde/core/config/BackendConfig';
import {EnvironmentVariable} from '@budgetbuddyde/core/environment/EnvironmentVariable';
import {getLogLevel, type LogThreshold} from '@budgetbuddyde/logger';
import {getCurrentRuntime, getPort, getTrustedOrigins, isRunningInProd} from '@budgetbuddyde/utils';
import type {CorsOptions} from 'cors';
import 'dotenv/config';
import type {Options as RateLimitOptions} from 'express-rate-limit';
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
  log: {
    threshold: LogThreshold;
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
      threshold: getLogLevel(process.env.LOG_LEVEL),
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
