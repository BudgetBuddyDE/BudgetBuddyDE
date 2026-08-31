import {ATTACHMENT_CONTENT_TYPES} from '@budgetbuddyde/api/attachment';
import {BackendConfig, type BackendConfigOptions} from '@budgetbuddyde/core/config/BackendConfig';
import {EnvironmentNotSetError} from '@budgetbuddyde/core/error/EnvironmentNotSetError';
import {getLogLevel, type LogThreshold} from '@budgetbuddyde/logger';
import type {CorsOptions} from 'cors';
import 'dotenv/config';
import type {Options as RateLimitOptions} from 'express-rate-limit';
import {name, version} from '../package.json';
import {HTTPStatusCode} from './models';

/** Complete, centrally constructed runtime configuration for the backend service. */
export class AppConfig extends BackendConfig {
  public readonly auth: {
    baseUrl: string;
    credentials: RequestCredentials;
  };
  public readonly database: {
    connectionString: string;
    connectionTimeoutMillis: number;
    maxConnections: number;
  };
  public readonly redis: {
    url?: string;
    database: number;
  };
  public readonly objectStorage: {
    endpoint?: string;
    bucketName?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    forcePathStyle: boolean;
  };
  public readonly log: {
    level: LogThreshold;
  };
  public readonly cors: CorsOptions;
  public readonly rateLimit: {
    enabled: boolean;
    keyPrefix: string;
    options: Partial<RateLimitOptions>;
  };
  public readonly exportRateLimit: {
    enabled: boolean;
    keyPrefix: string;
    options: Partial<RateLimitOptions>;
  };
  public readonly timezone: string;
  public readonly jobs: {
    recurringPayments: {
      enabled: boolean;
      name: string;
      schedule: string;
      timezone: string;
    };
  };
  public readonly cache: {
    /** Globally enable or disable caching. When false, no caching occurs regardless of Redis availability. */
    enabled: boolean;
    keyPrefix: string;
    invalidationScanCount: number;
    /** Per-route cache configuration. Only listed routes are cached. */
    routes: {
      /** Express path prefix to match, e.g. '/api/category' */
      path: string;
      /** Time-to-live in seconds */
      ttl: number;
      /** Optional custom prefix for the cache key. Defaults to `path`. */
      cacheKeyPrefix?: string;
    }[];
  };
  public readonly attachments: {
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

  constructor({
    auth,
    database,
    redis,
    objectStorage,
    log,
    cors,
    rateLimit,
    exportRateLimit,
    timezone,
    jobs,
    cache,
    attachments,
    ...backendConfig
  }: BackendConfigOptions &
    Pick<
      AppConfig,
      | 'auth'
      | 'database'
      | 'redis'
      | 'objectStorage'
      | 'log'
      | 'cors'
      | 'rateLimit'
      | 'exportRateLimit'
      | 'timezone'
      | 'jobs'
      | 'cache'
      | 'attachments'
    >) {
    super(backendConfig);
    this.auth = auth;
    this.database = database;
    this.redis = redis;
    this.objectStorage = objectStorage;
    this.log = log;
    this.cors = cors;
    this.rateLimit = rateLimit;
    this.exportRateLimit = exportRateLimit;
    this.timezone = timezone;
    this.jobs = jobs;
    this.cache = cache;
    this.attachments = attachments;
  }

  /** Builds the backend configuration from a process environment. */
  static fromEnvironment(environment: NodeJS.ProcessEnv = process.env): AppConfig {
    const runtime = AppConfig.getRuntime(environment.NODE_ENV);
    const service = name;
    const timezone = AppConfig.getOptionalEnvironmentValue(environment, 'TIMEZONE') ?? 'Europe/Berlin';
    const redisUrl = AppConfig.getOptionalEnvironmentValue(environment, 'REDIS_URL');

    return new AppConfig({
      service,
      version,
      port: AppConfig.getPort(environment.PORT, 9000),
      runtime,
      auth: {
        baseUrl: AppConfig.getOptionalEnvironmentValue(environment, 'AUTH_SERVICE_HOST') ?? 'http://localhost:8080',
        credentials: 'include',
      },
      database: {
        connectionString: AppConfig.getRequiredEnvironmentValue(environment, 'DATABASE_URL'),
        connectionTimeoutMillis: 5000,
        maxConnections: 20,
      },
      redis: {
        url: redisUrl,
        database: AppConfig.getRedisDatabase(environment.REDIS_DB),
      },
      objectStorage: {
        endpoint: AppConfig.getOptionalEnvironmentValue(environment, 'AWS_ENDPOINT_URL'),
        bucketName: AppConfig.getOptionalEnvironmentValue(environment, 'AWS_S3_BUCKET_NAME'),
        region: AppConfig.getOptionalEnvironmentValue(environment, 'AWS_DEFAULT_REGION'),
        accessKeyId: AppConfig.getOptionalEnvironmentValue(environment, 'AWS_ACCESS_KEY_ID'),
        secretAccessKey: AppConfig.getOptionalEnvironmentValue(environment, 'AWS_SECRET_ACCESS_KEY'),
        forcePathStyle: false,
      },
      log: {
        level: getLogLevel(environment.LOG_LEVEL),
      },
      cors: {
        origin:
          runtime === 'production'
            ? AppConfig.getTrustedOrigins(environment.TRUSTED_ORIGINS)
            : [/^(http|https):\/\/localhost(:\d+)?$/],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
        credentials: true,
      },
      rateLimit: {
        enabled: runtime === 'production' && redisUrl !== undefined,
        keyPrefix: `rate-limit:${service}:`,
        options: {
          windowMs: 5 * 60 * 1000,
          limit: 300,
          standardHeaders: 'draft-7',
          legacyHeaders: false,
          passOnStoreError: true,
          statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
        },
      },
      exportRateLimit: {
        enabled: runtime === 'production' && redisUrl !== undefined,
        keyPrefix: `rate-limit:${service}:application-export:`,
        options: {
          windowMs: 15 * 60 * 1000,
          limit: 4,
          standardHeaders: 'draft-7',
          legacyHeaders: false,
          passOnStoreError: false,
          statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
        },
      },
      timezone,
      jobs: {
        recurringPayments: {
          enabled: true,
          name: 'process-recurring-payments',
          schedule: '30 1 * * *',
          timezone,
        },
      },
      cache: {
        enabled: redisUrl !== undefined,
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
    });
  }

  /** Returns the configured Redis connection or raises a configuration error. */
  getRequiredRedisConfig(): RequiredRedisConfig {
    if (this.redis.url === undefined) {
      throw new EnvironmentNotSetError('REDIS_URL');
    }

    return {url: this.redis.url, database: this.redis.database};
  }

  /** Returns complete object-storage settings or identifies every missing value. */
  getRequiredObjectStorageConfig(): RequiredObjectStorageConfig {
    const environmentVariables = {
      AWS_ENDPOINT_URL: this.objectStorage.endpoint,
      AWS_S3_BUCKET_NAME: this.objectStorage.bucketName,
      AWS_DEFAULT_REGION: this.objectStorage.region,
      AWS_ACCESS_KEY_ID: this.objectStorage.accessKeyId,
      AWS_SECRET_ACCESS_KEY: this.objectStorage.secretAccessKey,
    };
    const missing = Object.entries(environmentVariables)
      .filter(([, value]) => value === undefined)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(`Object storage is not configured. Set ${missing.join(', ')}.`);
    }

    return {
      endpoint: this.objectStorage.endpoint as string,
      bucketName: this.objectStorage.bucketName as string,
      region: this.objectStorage.region as string,
      accessKeyId: this.objectStorage.accessKeyId as string,
      secretAccessKey: this.objectStorage.secretAccessKey as string,
      forcePathStyle: this.objectStorage.forcePathStyle,
    };
  }

  private static getOptionalEnvironmentValue(environment: NodeJS.ProcessEnv, name: string): string | undefined {
    const value = environment[name]?.trim();
    return value === '' || value === undefined ? undefined : value;
  }

  private static getRequiredEnvironmentValue(environment: NodeJS.ProcessEnv, name: string): string {
    const value = AppConfig.getOptionalEnvironmentValue(environment, name);
    if (value === undefined) throw new EnvironmentNotSetError(name);
    return value;
  }

  private static getRuntime(value: string | undefined): 'production' | 'development' | 'test' {
    switch (value?.toLowerCase()) {
      case 'production':
        return 'production';
      case 'test':
        return 'test';
      case 'development':
        return 'development';
      default:
        return 'development';
    }
  }

  private static getPort(value: string | undefined, fallbackPort: number): number {
    const port = Number.parseInt(value ?? '', 10);
    return Number.isNaN(port) ? fallbackPort : port;
  }

  private static getRedisDatabase(value: string | undefined): number {
    if (value === undefined || value.trim() === '') return 1;

    const database = Number(value);
    return Number.isFinite(database) ? database : 1;
  }

  private static getTrustedOrigins(value: string | undefined): string[] {
    return (
      value
        ?.split(',')
        .map(origin => origin.trim())
        .filter(Boolean) ?? []
    );
  }
}

export type CacheRouteConfig = AppConfig['cache']['routes'][number];
export type ObjectStorageConfig = AppConfig['objectStorage'];
export type RequiredObjectStorageConfig = Required<ObjectStorageConfig>;
export type RedisConfig = AppConfig['redis'];
export type RequiredRedisConfig = Required<RedisConfig>;

export const config = AppConfig.fromEnvironment();
