import {BackendConfig} from '@budgetbuddyde/core/config/BackendConfig';
import {EnvironmentNotSetError} from '@budgetbuddyde/core/error/EnvironmentNotSetError';
import {describe, expect, it} from 'vitest';
import {AppConfig} from '../config';

function createConfig(environment: NodeJS.ProcessEnv = {}): AppConfig {
  return AppConfig.fromEnvironment({
    DATABASE_URL: 'postgres://localhost/budgetbuddy',
    AUTH_SECRET: 'unit-test-secret-at-least-thirty-two-characters',
    RESEND_API_KEY: 're_test',
    ...environment,
  });
}

describe('AppConfig', () => {
  it('extends BackendConfig and applies backend defaults', () => {
    const config = createConfig({PORT: '9010', TIMEZONE: 'UTC'});

    expect(config).toBeInstanceOf(BackendConfig);
    expect(config.port).toBe(9010);
    expect(config.timezone).toBe('UTC');
    expect(config.jobs.recurringPayments.timezone).toBe('UTC');
    expect(config.auth.baseUrl).toBe('http://localhost:9010');
    expect(config.auth.redis).toEqual({url: undefined, database: 0});
    expect(config.auth.trustedOrigins).toEqual(['http://localhost:3000']);
  });

  it('builds production CORS origins from trimmed environment values', () => {
    const config = createConfig({
      NODE_ENV: 'production',
      BASE_URL: 'https://backend.budget-buddy.de',
      TRUSTED_ORIGINS: ' https://budget-buddy.de , https://demo.budget-buddy.de ',
      REDIS_URL: 'redis://localhost:6379',
    });

    expect(config.cors.origin).toEqual(['https://budget-buddy.de', 'https://demo.budget-buddy.de']);
    expect(config.rateLimit.enabled).toBe(true);
    expect(config.exportRateLimit.enabled).toBe(true);
  });

  it('uses Redis database zero and enables the cache when Redis is configured', () => {
    const config = createConfig({REDIS_URL: 'redis://localhost:6379', REDIS_DB: '0'});

    expect(config.redis).toEqual({url: 'redis://localhost:6379', database: 0});
    expect(config.cache.enabled).toBe(true);
    expect(config.getRequiredRedisConfig()).toEqual({url: 'redis://localhost:6379', database: 0});
  });

  it('keeps Redis optional until a Redis consumer requires it', () => {
    const config = createConfig();

    expect(config.redis.url).toBeUndefined();
    expect(config.cache.enabled).toBe(false);
    expect(
      createConfig({
        NODE_ENV: 'production',
        BASE_URL: 'https://backend.example',
        TRUSTED_ORIGINS: 'https://app.example',
      }).rateLimit.enabled,
    ).toBe(false);
    expect(() => config.getRequiredRedisConfig()).toThrow(EnvironmentNotSetError);
  });

  it('reports every missing object-storage setting when attachments require it', () => {
    const config = createConfig();

    expect(() => config.getRequiredObjectStorageConfig()).toThrow(
      'AWS_ENDPOINT_URL, AWS_S3_BUCKET_NAME, AWS_DEFAULT_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY',
    );
  });

  it('returns complete object-storage settings only when all required values are configured', () => {
    const config = createConfig({
      AWS_ENDPOINT_URL: 'http://localhost:9001',
      AWS_S3_BUCKET_NAME: 'attachments',
      AWS_DEFAULT_REGION: 'eu-central-1',
      AWS_ACCESS_KEY_ID: 'access-key',
      AWS_SECRET_ACCESS_KEY: 'secret-key',
    });

    expect(config.getRequiredObjectStorageConfig()).toEqual({
      endpoint: 'http://localhost:9001',
      bucketName: 'attachments',
      region: 'eu-central-1',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      forcePathStyle: false,
    });
  });

  it('rejects blank required environment values', () => {
    expect(() => createConfig({DATABASE_URL: '  '})).toThrow(EnvironmentNotSetError);
  });
});

describe('integrated authentication configuration', () => {
  it('requires auth credentials and a public production URL', () => {
    for (const name of ['AUTH_SECRET', 'RESEND_API_KEY']) {
      expect(() => createConfig({[name]: ' '})).toThrow(EnvironmentNotSetError);
    }
    expect(() => createConfig({NODE_ENV: 'production'})).toThrow('TRUSTED_ORIGINS');
    expect(() => createConfig({NODE_ENV: 'production', TRUSTED_ORIGINS: 'https://app.example'})).toThrow('BASE_URL');
  });

  it('uses a complete URL unchanged and does not append a second port', () => {
    const config = createConfig({BASE_URL: 'http://localhost:9010/', PORT: '9999'});
    expect(config.auth.baseUrl).toBe('http://localhost:9010');
  });

  it.each([
    'ftp://backend.example',
    'https://backend.example/api/auth',
    'https://backend.example?query=1',
    'https://backend.example/#fragment',
    'https://user:password@backend.example',
  ])('rejects an invalid public origin %s', BASE_URL => {
    expect(() => createConfig({BASE_URL})).toThrow('BASE_URL must be an HTTP(S) origin');
  });

  it('keeps auth storage independent from domain Redis', () => {
    const config = createConfig({
      REDIS_URL: 'redis://domain:6379',
      REDIS_DB: '3',
      AUTH_REDIS_URL: 'redis://auth:6379',
      AUTH_REDIS_DB: '2',
    });
    expect(config.redis).toEqual({url: 'redis://domain:6379', database: 3});
    expect(config.auth.redis).toEqual({url: 'redis://auth:6379', database: 2});
    expect(createConfig({REDIS_URL: 'redis://domain:6379'}).auth.redis.url).toBeUndefined();
  });

  it('retains independent production rate limits with either Redis connection', () => {
    const config = createConfig({
      NODE_ENV: 'production',
      BASE_URL: 'https://backend.example',
      TRUSTED_ORIGINS: 'https://app.example',
      AUTH_REDIS_URL: 'redis://auth:6379',
    });
    expect(config.auth.rateLimit.enabled).toBe(true);
    expect(config.auth.rateLimit.options).toMatchObject({limit: 500, windowMs: 300000});
    expect(config.auth.exportRateLimit.options).toMatchObject({limit: 2, windowMs: 900000, passOnStoreError: false});
    expect(config.rateLimit.enabled).toBe(false);
    expect(config.rateLimit.options.limit).toBe(300);
  });

  it('reads auth switches and trims social credentials', () => {
    const config = createConfig({
      DISABLE_SIGNUP: 'true',
      DISABLE_CSRF_CHECK: 'true',
      GITHUB_CLIENT_ID: ' github-id ',
      GITHUB_CLIENT_SECRET: ' github-secret ',
      GOOGLE_CLIENT_ID: ' google-id ',
      GOOGLE_CLIENT_SECRET: ' google-secret ',
    });
    expect(config.auth).toMatchObject({
      disableSignUp: true,
      disableCsrfCheck: true,
      socialProviders: {
        github: {clientId: 'github-id', clientSecret: 'github-secret'},
        google: {clientId: 'google-id', clientSecret: 'google-secret'},
      },
    });
    expect(config.cors.allowedHeaders).toContain('X-Api-Key');
  });
});
