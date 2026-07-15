import {ATTACHMENT_CONTENT_TYPES} from '@budgetbuddyde/api/attachment';
import {getLogLevel} from '@budgetbuddyde/logger';
import {getCurrentRuntime, getPort, getTrustedOrigins, isRunningInProd, type Runtime} from '@budgetbuddyde/utils';
import type {CorsOptions} from 'cors';
import 'dotenv/config';
import type {Options as RateLimitOptions} from 'express-rate-limit';
import {type Logger, transports} from 'winston';
import LokiTransport from 'winston-loki';
import {name, version} from '../package.json';
import {HTTPStatusCode} from './models';
import {EnvironmentVariableNotSetError} from './types/error';

export type CacheRouteConfig = {
  /** Express path prefix to match, e.g. '/api/category' */
  path: string;
  /** Time-to-live in seconds */
  ttl: number;
  /** Optional custom prefix for the cache key. Defaults to `path`. */
  cacheKeyPrefix?: string;
};

export type ObjectStorageConfig = {
  endpoint: string | undefined;
  bucketName: string | undefined;
  region: string | undefined;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  forcePathStyle: boolean;
};

export type RequiredObjectStorageConfig = {
  endpoint: string;
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

export type RequiredRedisConfig = {
  url: string;
  database: number;
};

export type Config = {
  service: typeof name;
  version: typeof version;
  port: ReturnType<typeof getPort>;
  runtime: Runtime;
  auth: {
    baseUrl: string;
    credentials: RequestCredentials;
  };
  database: {
    connectionString: string | undefined;
    connectionTimeoutMillis: number;
    maxConnections: number;
  };
  redis: {
    url: string | undefined;
    database: number;
  };
  objectStorage: ObjectStorageConfig;
  log: Pick<Logger, 'level' | 'transports'> & {
    defaultMeta?: Record<string, string | number | boolean>;
    hideMeta?: boolean;
    timestampFormat: string;
  };
  cors: CorsOptions;
  rateLimit: {
    enabled: boolean;
    keyPrefix: string;
    options: Partial<RateLimitOptions>;
  };
  timezone: string;
  jobs: {
    recurringPayments: {
      enabled: boolean;
      name: string;
      schedule: string;
      timezone: string;
    };
  };
  cache: {
    /** Globally enable or disable caching. When false, no caching occurs regardless of Redis availability. */
    enabled: boolean;
    keyPrefix: string;
    invalidationScanCount: number;
    /** Per-route cache configuration. Only listed routes are cached. */
    routes: CacheRouteConfig[];
  };
  attachments: {
    cacheNamespace: string;
    signedUrlTtlSeconds: number;
    transactionPreviewLimit: number;
    allowedContentTypes: ReadonlySet<string>;
    octetStreamAllowedExtensions: ReadonlySet<string>;
    mimeTypeOverrides: Readonly<Record<string, string>>;
    upload: {
      maxFilesPerRequest: number;
      maxFileSizeBytes: number;
    };
    pagination: {
      defaultPageSize: number;
      maxPageSize: number;
    };
    imageOptimization: {
      maxDimensionPx: number;
      mimeTypes: ReadonlySet<string>;
      jpegQuality: number;
      pngCompressionLevel: number;
      webpQuality: number;
    };
  };
};

const SERVICE_NAME = name;
const SERVICE_VERSION = version;
const SERVICE_RUNTIME = getCurrentRuntime();
const TIMEZONE = process.env.TIMEZONE || 'Europe/Berlin';
const REDIS_URL = process.env.REDIS_URL;
const OBJECT_STORAGE: ObjectStorageConfig = {
  endpoint: process.env.AWS_ENDPOINT_URL,
  bucketName: process.env.AWS_S3_BUCKET_NAME,
  region: process.env.AWS_DEFAULT_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  forcePathStyle: false,
};

export const config: Config = {
  service: SERVICE_NAME,
  version: SERVICE_VERSION,
  port: getPort(9000),
  runtime: SERVICE_RUNTIME,
  auth: {
    baseUrl: process.env.AUTH_SERVICE_HOST || 'http://localhost:8080',
    credentials: 'include',
  },
  database: {
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    maxConnections: 20,
  },
  redis: {
    url: REDIS_URL,
    database: Number(process.env.REDIS_DB) || 1,
  },
  objectStorage: OBJECT_STORAGE,
  log: {
    level: getLogLevel(process.env.LOG_LEVEL),
    defaultMeta: {
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      runtime: SERVICE_RUNTIME,
    },
    hideMeta: process.env.LOG_HIDE_META === 'true',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss',
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
    enabled: SERVICE_RUNTIME === 'production',
    keyPrefix: `rate-limit:${SERVICE_NAME}:`,
    options: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      limit: 300, // 300 requests per window per IP
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      passOnStoreError: true,
      statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
    },
  },
  timezone: TIMEZONE,
  jobs: {
    recurringPayments: {
      enabled: true,
      name: 'process-recurring-payments',
      schedule: '30 1 * * *',
      timezone: TIMEZONE,
    },
  },
  cache: {
    enabled: Boolean(REDIS_URL),
    keyPrefix: 'cache',
    invalidationScanCount: 100,
    routes: [
      {path: '/api/category', ttl: 300},
      {path: '/api/paymentMethod', ttl: 300},
      {path: '/api/transaction', ttl: 60},
      {path: '/api/recurringPayment', ttl: 300},
      {path: '/api/budget', ttl: 300},
      {path: '/api/insights', ttl: 120},
    ],
  },
  attachments: {
    cacheNamespace: 'attachments',
    signedUrlTtlSeconds: 900,
    transactionPreviewLimit: 3,
    allowedContentTypes: new Set<string>(ATTACHMENT_CONTENT_TYPES),
    octetStreamAllowedExtensions: new Set(['heic', 'heif']),
    mimeTypeOverrides: {
      heic: 'image/heic',
      heif: 'image/heif',
    },
    upload: {
      maxFilesPerRequest: 10,
      maxFileSizeBytes: 20 * 1024 * 1024,
    },
    pagination: {
      defaultPageSize: 24,
      maxPageSize: 100,
    },
    imageOptimization: {
      maxDimensionPx: 1920,
      mimeTypes: new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
      jpegQuality: 82,
      pngCompressionLevel: 9,
      webpQuality: 82,
    },
  },
};

/**
 * Returns a complete object-storage configuration or reports all missing
 * environment variables in one error.
 */
export function getRequiredObjectStorageConfig(): RequiredObjectStorageConfig {
  const requiredValues = {
    AWS_ENDPOINT_URL: config.objectStorage.endpoint,
    AWS_S3_BUCKET_NAME: config.objectStorage.bucketName,
    AWS_DEFAULT_REGION: config.objectStorage.region,
    AWS_ACCESS_KEY_ID: config.objectStorage.accessKeyId,
    AWS_SECRET_ACCESS_KEY: config.objectStorage.secretAccessKey,
  };
  const missingEnvironmentVariables = Object.entries(requiredValues)
    .filter(([, value]) => !value)
    .map(([environmentVariable]) => environmentVariable);

  if (missingEnvironmentVariables.length > 0) {
    throw new EnvironmentVariableNotSetError(missingEnvironmentVariables.join(', '));
  }

  return {
    endpoint: requiredValues.AWS_ENDPOINT_URL as string,
    bucketName: requiredValues.AWS_S3_BUCKET_NAME as string,
    region: requiredValues.AWS_DEFAULT_REGION as string,
    accessKeyId: requiredValues.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: requiredValues.AWS_SECRET_ACCESS_KEY as string,
    forcePathStyle: config.objectStorage.forcePathStyle,
  };
}

/** Returns the Redis configuration or reports the missing connection URL. */
export function getRequiredRedisConfig(): RequiredRedisConfig {
  if (!config.redis.url) {
    throw new EnvironmentVariableNotSetError('REDIS_URL');
  }

  return {
    url: config.redis.url,
    database: config.redis.database,
  };
}
