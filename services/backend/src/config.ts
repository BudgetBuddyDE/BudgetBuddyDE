import {ATTACHMENT_CONTENT_TYPES} from '@budgetbuddyde/api/attachment';
import {
  BackendConfig,
  type BackendConfigOptions,
  getPort,
  getRedisDatabase,
  getRuntime,
  getTrustedOrigins,
  getTrustProxy,
} from '@budgetbuddyde/core/config/BackendConfig';
import {EnvironmentNotSetError} from '@budgetbuddyde/core/error/EnvironmentNotSetError';
import {getLogLevel, type LogThreshold} from '@budgetbuddyde/logger';
import type {CorsOptions} from 'cors';
import 'dotenv/config';
import type {Options as RateLimitOptions} from 'express-rate-limit';
import {name, version} from '../package.json';
import {parseEnvironment, type EnvironmentInput, type ValidatedBackendEnvironment} from './env';
import {HTTPStatusCode} from './models/HttpStatusCode';

function getRequiredEnvironmentValue(
  environment: ValidatedBackendEnvironment,
  name: 'BASE_URL' | 'AUTH_SECRET' | 'RESEND_API_KEY' | 'DATABASE_URL',
): string {
  const value = environment[name];
  if (value === undefined || value.trim() === '') throw new EnvironmentNotSetError(name);
  return value;
}

function runtimeRequiredEnvironmentNames(
  environment: EnvironmentInput,
): ('DATABASE_URL' | 'AUTH_SECRET' | 'RESEND_API_KEY' | 'BASE_URL')[] {
  return environment.NODE_ENV?.toLowerCase() === 'production'
    ? ['DATABASE_URL', 'AUTH_SECRET', 'RESEND_API_KEY', 'BASE_URL']
    : ['DATABASE_URL', 'AUTH_SECRET', 'RESEND_API_KEY'];
}

/** Complete, centrally constructed runtime configuration for the backend service. */
export class AppConfig extends BackendConfig {
  public readonly auth: {
    baseUrl: string;
    secret: string;
    trustedOrigins: string[];
    disableCsrfCheck: boolean;
    disableSignUp: boolean;
    socialProviders: {
      github: {clientId?: string; clientSecret?: string};
      google: {clientId?: string; clientSecret?: string};
    };
    redis: {url?: string; database: number};
    rateLimit: AppConfig['rateLimit'];
    exportRateLimit: AppConfig['exportRateLimit'];
  };
  public readonly mcp: {rateLimit: {enabled: boolean; windowMs: number; limit: number}};
  public readonly email: {resendApiKey: string};
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
  /** Express `trust proxy` setting for the deployment topology. */
  public readonly trustProxy: boolean | number | string;
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
  public readonly export: {
    /** Maximum size in bytes of a generated application export archive. */
    maxBytes: number;
    /** Maximum number of attachment objects downloaded from storage concurrently. */
    attachmentConcurrency: number;
  };
  public readonly pagination: {
    /** Upper bound for the `to - from` window accepted by list endpoints. */
    maxPageSize: number;
  };
  public readonly timezone: string;
  public readonly jobs: {
    recurringPayments: {
      name: string;
      schedule: string;
      timezone: string;
    };
  };
  public readonly cache: {
    /** Globally enable or disable caching. When false, no caching occurs regardless of Redis availability. */
    enabled: boolean;
    keyPrefix: string;
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
      /** Maximum combined size in bytes of a single multipart upload request. */
      maxRequestSizeBytes: number;
      /** Maximum number of files processed and uploaded concurrently. */
      processingConcurrency: number;
    };
    pagination: {
      defaultPageSize: number;
      maxPageSize: number;
    };
    imageOptimization: {
      maxDimensionPx: number;
      /** Rejects decoded images above this pixel count to prevent decompression bombs. */
      maxInputPixels: number;
      mimeTypes: ReadonlySet<string>;
      jpegQuality: number;
      pngCompressionLevel: number;
      webpQuality: number;
    };
  };

  constructor({
    auth,
    email,
    mcp,
    database,
    redis,
    objectStorage,
    log,
    cors,
    trustProxy,
    rateLimit,
    exportRateLimit,
    export: exportConfig,
    pagination,
    timezone,
    jobs,
    cache,
    attachments,
    ...backendConfig
  }: BackendConfigOptions &
    Pick<
      AppConfig,
      | 'auth'
      | 'mcp'
      | 'email'
      | 'database'
      | 'redis'
      | 'objectStorage'
      | 'log'
      | 'cors'
      | 'trustProxy'
      | 'rateLimit'
      | 'exportRateLimit'
      | 'export'
      | 'pagination'
      | 'timezone'
      | 'jobs'
      | 'cache'
      | 'attachments'
    >) {
    super(backendConfig);
    this.auth = auth;
    this.email = email;
    this.mcp = mcp;
    this.database = database;
    this.redis = redis;
    this.objectStorage = objectStorage;
    this.log = log;
    this.cors = cors;
    this.trustProxy = trustProxy;
    this.rateLimit = rateLimit;
    this.exportRateLimit = exportRateLimit;
    this.export = exportConfig;
    this.pagination = pagination;
    this.timezone = timezone;
    this.jobs = jobs;
    this.cache = cache;
    this.attachments = attachments;
  }

  /** Builds the backend configuration from a process environment. */
  static fromEnvironment(environment: EnvironmentInput = process.env): AppConfig {
    const env = parseEnvironment(environment);
    const required = runtimeRequiredEnvironmentNames(environment);
    if (getRuntime(env.NODE_ENV) === 'production' && (env.TRUSTED_ORIGINS ?? '').trim() === '') {
      throw new EnvironmentNotSetError('TRUSTED_ORIGINS');
    }
    const missing = required.filter(name => {
      const value = env[name];
      return value === undefined || value.trim() === '';
    });
    if (missing.length > 0) throw new EnvironmentNotSetError(missing[0]!);
    const validatedEnv: ValidatedBackendEnvironment = {
      ...env,
      DATABASE_URL: env.DATABASE_URL!,
      AUTH_SECRET: env.AUTH_SECRET!,
      BASE_URL: env.BASE_URL!,
      RESEND_API_KEY: env.RESEND_API_KEY!,
    };
    const runtime = getRuntime(env.NODE_ENV);
    const service = name;
    const timezone = env.TIMEZONE ?? 'Europe/Berlin';
    const redisUrl = env.REDIS_URL;
    const authRedisUrl = env.AUTH_REDIS_URL;
    const trustedOrigins = getTrustedOrigins(env.TRUSTED_ORIGINS);
    const port = getPort(env.PORT, 9000);
    if (runtime === 'production' && trustedOrigins.length === 0) {
      throw new EnvironmentNotSetError('TRUSTED_ORIGINS');
    }
    const baseUrl =
      runtime === 'production'
        ? getRequiredEnvironmentValue(validatedEnv, 'BASE_URL')
        : (env.BASE_URL ?? `http://localhost:${port}`);
    const publicUrl = new URL(baseUrl);
    if (
      !['http:', 'https:'].includes(publicUrl.protocol) ||
      publicUrl.pathname !== '/' ||
      publicUrl.search ||
      publicUrl.hash ||
      publicUrl.username ||
      publicUrl.password
    ) {
      throw new Error('BASE_URL must be an HTTP(S) origin without credentials, a path, query, or fragment.');
    }

    return new AppConfig({
      service,
      version,
      port,
      runtime,
      auth: {
        baseUrl: publicUrl.origin,
        secret: getRequiredEnvironmentValue(validatedEnv, 'AUTH_SECRET'),
        trustedOrigins: trustedOrigins.length > 0 ? trustedOrigins : ['http://localhost:3000'],
        disableCsrfCheck: env.DISABLE_CSRF_CHECK === 'true',
        disableSignUp: env.DISABLE_SIGNUP === 'true',
        socialProviders: {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        },
        redis: {url: authRedisUrl, database: getRedisDatabase(env.AUTH_REDIS_DB, 0)},
        rateLimit: {
          enabled: runtime === 'production' && (redisUrl !== undefined || authRedisUrl !== undefined),
          keyPrefix: `rate-limit:${service}:auth:`,
          options: {
            windowMs: 5 * 60 * 1000,
            limit: 500,
            standardHeaders: 'draft-7',
            legacyHeaders: false,
            passOnStoreError: true,
            statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
          },
        },
        exportRateLimit: {
          enabled: runtime === 'production' && (redisUrl !== undefined || authRedisUrl !== undefined),
          keyPrefix: `rate-limit:${service}:auth-export:`,
          options: {
            windowMs: 15 * 60 * 1000,
            limit: 2,
            standardHeaders: 'draft-7',
            legacyHeaders: false,
            passOnStoreError: false,
            statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
          },
        },
      },
      mcp: {rateLimit: {enabled: runtime === 'production', windowMs: 60_000, limit: 120}},
      email: {resendApiKey: getRequiredEnvironmentValue(validatedEnv, 'RESEND_API_KEY')},
      database: {
        connectionString: getRequiredEnvironmentValue(validatedEnv, 'DATABASE_URL'),
        connectionTimeoutMillis: 5000,
        maxConnections: 20,
      },
      redis: {
        url: redisUrl,
        database: getRedisDatabase(env.REDIS_DB, 1),
      },
      objectStorage: {
        endpoint: env.AWS_ENDPOINT_URL,
        bucketName: env.AWS_S3_BUCKET_NAME,
        region: env.AWS_DEFAULT_REGION,
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        forcePathStyle: false,
      },
      log: {
        level: getLogLevel(env.LOG_LEVEL),
      },
      cors: {
        origin:
          runtime === 'production' ? getTrustedOrigins(env.TRUSTED_ORIGINS) : [/^(http|https):\/\/localhost(:\d+)?$/],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-User-Id',
          'X-Api-Key',
          'MCP-Protocol-Version',
          'Mcp-Session-Id',
          'Last-Event-ID',
          'traceparent',
          'tracestate',
          'baggage',
        ],
        exposedHeaders: ['MCP-Protocol-Version', 'Mcp-Session-Id'],
        credentials: true,
      },
      trustProxy: getTrustProxy(env.TRUST_PROXY, runtime),
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
      pagination: {
        maxPageSize: 100,
      },
      export: {
        maxBytes: 100 * 1024 * 1024,
        attachmentConcurrency: 4,
      },
      timezone,
      jobs: {
        recurringPayments: {
          name: 'process-recurring-payments',
          schedule: '30 1 * * *',
          timezone,
        },
      },
      cache: {
        enabled: redisUrl !== undefined,
        keyPrefix: 'cache',
        routes: [
          {path: '/api/category', ttl: 300},
          {path: '/api/paymentMethod', ttl: 300},
          {path: '/api/preference', ttl: 300},
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
          maxRequestSizeBytes: 50 * 1024 * 1024,
          processingConcurrency: 4,
        },
        pagination: {
          defaultPageSize: 24,
          maxPageSize: 100,
        },
        imageOptimization: {
          maxDimensionPx: 1920,
          maxInputPixels: 100_000_000,
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
}

export type CacheRouteConfig = AppConfig['cache']['routes'][number];
type ObjectStorageConfig = AppConfig['objectStorage'];
type RequiredObjectStorageConfig = Required<ObjectStorageConfig>;
type RedisConfig = AppConfig['redis'];
type RequiredRedisConfig = Required<RedisConfig>;

export const config = AppConfig.fromEnvironment();
