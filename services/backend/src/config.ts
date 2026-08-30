import {ATTACHMENT_CONTENT_TYPES} from '@budgetbuddyde/api/attachment';
import {BackendConfig} from '@budgetbuddyde/core/config/BackendConfig';
import {EnvironmentVariable} from '@budgetbuddyde/core/environment/EnvironmentVariable';
import {getLogLevel, type LogThreshold} from '@budgetbuddyde/logger';
import {getCurrentRuntime, getPort, getTrustedOrigins, isRunningInProd} from '@budgetbuddyde/utils';
import type {CorsOptions} from 'cors';
import 'dotenv/config';
import type {Options as RateLimitOptions} from 'express-rate-limit';
import {name, version} from '../package.json';
import {HTTPStatusCode} from './models';

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

export type Config = BackendConfig & {
  auth: {
    baseUrl: string;
    credentials: RequestCredentials;
  };
  database: {
    connectionString: string;
    connectionTimeoutMillis: number;
    maxConnections: number;
  };
  redis: {
    url: string;
    database: number;
  };
  objectStorage: RequiredObjectStorageConfig;
  log: {
    level: LogThreshold;
  };
  cors: CorsOptions;
  rateLimit: {
    enabled: boolean;
    keyPrefix: string;
    options: Partial<RateLimitOptions>;
  };
  exportRateLimit: {
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
const DATABASE_URL = new EnvironmentVariable('DATABASE_URL').get();
const REDIS_URL = new EnvironmentVariable('REDIS_URL').get();
const OBJECT_STORAGE: RequiredObjectStorageConfig = {
  endpoint: new EnvironmentVariable('AWS_ENDPOINT_URL').get(),
  bucketName: new EnvironmentVariable('AWS_S3_BUCKET_NAME').get(),
  region: new EnvironmentVariable('AWS_DEFAULT_REGION').get(),
  accessKeyId: new EnvironmentVariable('AWS_ACCESS_KEY_ID').get(),
  secretAccessKey: new EnvironmentVariable('AWS_SECRET_ACCESS_KEY').get(),
  forcePathStyle: false,
};

export const config: Config = Object.assign(
  new BackendConfig({
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    port: getPort(9000),
    runtime: SERVICE_RUNTIME,
  }),
  {
    auth: {
      baseUrl: process.env.AUTH_SERVICE_HOST || 'http://localhost:8080',
      credentials: 'include' as RequestCredentials,
    },
    database: {
      connectionString: DATABASE_URL,
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
        standardHeaders: 'draft-7' as const,
        legacyHeaders: false,
        passOnStoreError: true,
        statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
      },
    },
    exportRateLimit: {
      enabled: SERVICE_RUNTIME === 'production',
      keyPrefix: `rate-limit:${SERVICE_NAME}:application-export:`,
      options: {
        windowMs: 15 * 60 * 1000,
        limit: 4,
        standardHeaders: 'draft-7' as const,
        legacyHeaders: false,
        passOnStoreError: false,
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
  },
);

/**
 * Returns a complete object-storage configuration or reports all missing
 * environment variables in one error.
 */
export function getRequiredObjectStorageConfig(): RequiredObjectStorageConfig {
  return config.objectStorage;
}

/** Returns the Redis configuration or reports the missing connection URL. */
export function getRequiredRedisConfig(): RequiredRedisConfig {
  return config.redis;
}
