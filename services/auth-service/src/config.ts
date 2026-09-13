import {
  BackendConfig,
  type BackendConfigOptions,
  getOptionalEnvironmentValue,
  getPort,
  getRedisDatabase,
  getRuntime,
  getTrustedOrigins,
} from '@budgetbuddyde/core/config/BackendConfig';
import {EnvironmentNotSetError} from '@budgetbuddyde/core/error/EnvironmentNotSetError';
import {getLogLevel, type LogThreshold} from '@budgetbuddyde/logger';
import type {CorsOptions} from 'cors';
import 'dotenv/config';
import type {Options as RateLimitOptions} from 'express-rate-limit';
import {name, version} from '../package.json';
import {HTTPStatusCode} from './models';

function getRequiredEnvironmentValue(environment: NodeJS.ProcessEnv, name: string): string {
  const value = getOptionalEnvironmentValue(environment, name);
  if (value === undefined) throw new EnvironmentNotSetError(name);
  return value;
}

/** Complete, centrally constructed runtime configuration for the auth service. */
export class AppConfig extends BackendConfig {
  public readonly baseUrl: string;
  public readonly database: {
    connectionString: string;
  };
  public readonly redis: {
    url?: string;
    database: number;
  };
  public readonly email: {
    resendApiKey: string;
  };
  public readonly auth: {
    secret: string;
    trustedOrigins: string[];
    disableCsrfCheck: boolean;
    disableSignUp: boolean;
    socialProviders: {
      github: {
        clientId?: string;
        clientSecret?: string;
      };
      google: {
        clientId?: string;
        clientSecret?: string;
      };
    };
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
  public readonly jobs: {
    timezone: string;
  };

  constructor({
    baseUrl,
    database,
    redis,
    email,
    auth,
    log,
    cors,
    rateLimit,
    exportRateLimit,
    jobs,
    ...backendConfig
  }: BackendConfigOptions &
    Pick<
      AppConfig,
      'baseUrl' | 'database' | 'redis' | 'email' | 'auth' | 'log' | 'cors' | 'rateLimit' | 'exportRateLimit' | 'jobs'
    >) {
    super(backendConfig);
    this.baseUrl = baseUrl;
    this.database = database;
    this.redis = redis;
    this.email = email;
    this.auth = auth;
    this.log = log;
    this.cors = cors;
    this.rateLimit = rateLimit;
    this.exportRateLimit = exportRateLimit;
    this.jobs = jobs;
  }

  /** Builds the auth-service configuration from a process environment. */
  static fromEnvironment(environment: NodeJS.ProcessEnv = process.env): AppConfig {
    const runtime = getRuntime(environment.NODE_ENV);
    const service = name;
    const redisUrl = getOptionalEnvironmentValue(environment, 'REDIS_URL');
    const trustedOrigins = getTrustedOrigins(environment.TRUSTED_ORIGINS);

    if (runtime === 'production' && trustedOrigins.length === 0) {
      throw new EnvironmentNotSetError('TRUSTED_ORIGINS');
    }

    return new AppConfig({
      service,
      version,
      port: getPort(environment.PORT, 8080),
      runtime,
      baseUrl: getOptionalEnvironmentValue(environment, 'BASE_URL') ?? 'http://localhost',
      database: {
        connectionString: getRequiredEnvironmentValue(environment, 'DATABASE_URL'),
      },
      redis: {
        url: redisUrl,
        database: getRedisDatabase(environment.REDIS_DB, 0),
      },
      email: {
        resendApiKey: getRequiredEnvironmentValue(environment, 'RESEND_API_KEY'),
      },
      auth: {
        secret: getRequiredEnvironmentValue(environment, 'AUTH_SECRET'),
        trustedOrigins: trustedOrigins.length > 0 ? trustedOrigins : ['http://localhost:3000'],
        disableCsrfCheck: environment.DISABLE_CSRF_CHECK === 'true',
        disableSignUp: environment.DISABLE_SIGNUP === 'true',
        socialProviders: {
          github: {
            clientId: getOptionalEnvironmentValue(environment, 'GITHUB_CLIENT_ID'),
            clientSecret: getOptionalEnvironmentValue(environment, 'GITHUB_CLIENT_SECRET'),
          },
          google: {
            clientId: getOptionalEnvironmentValue(environment, 'GOOGLE_CLIENT_ID'),
            clientSecret: getOptionalEnvironmentValue(environment, 'GOOGLE_CLIENT_SECRET'),
          },
        },
      },
      log: {
        level: getLogLevel(environment.LOG_LEVEL),
      },
      cors: {
        origin: runtime === 'production' ? trustedOrigins : [/^(http|https):\/\/localhost(:\d+)?$/],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
        credentials: true,
      },
      rateLimit: {
        enabled: runtime === 'production' && redisUrl !== undefined,
        keyPrefix: `rate-limit:${service}:`,
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
        enabled: runtime === 'production' && redisUrl !== undefined,
        keyPrefix: `rate-limit:${service}:export:`,
        options: {
          windowMs: 15 * 60 * 1000,
          limit: 2,
          standardHeaders: 'draft-7',
          legacyHeaders: false,
          passOnStoreError: false,
          statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
        },
      },
      jobs: {
        timezone: getOptionalEnvironmentValue(environment, 'TIMEZONE') ?? 'Europe/Berlin',
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
}

export type RedisConfig = AppConfig['redis'];
export type RequiredRedisConfig = Required<RedisConfig>;

export const config = AppConfig.fromEnvironment();
