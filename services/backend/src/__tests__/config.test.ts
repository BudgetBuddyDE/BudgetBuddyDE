import {BackendConfig} from '@budgetbuddyde/core/config/BackendConfig';
import {EnvironmentNotSetError} from '@budgetbuddyde/core/error/EnvironmentNotSetError';
import {describe, expect, it} from 'vitest';
import {AppConfig} from '../config';

function createConfig(environment: NodeJS.ProcessEnv = {}): AppConfig {
  return AppConfig.fromEnvironment({DATABASE_URL: 'postgres://localhost/budgetbuddy', ...environment});
}

describe('AppConfig', () => {
  it('extends BackendConfig and applies backend defaults', () => {
    const config = createConfig({PORT: '9010', TIMEZONE: 'UTC'});

    expect(config).toBeInstanceOf(BackendConfig);
    expect(config.port).toBe(9010);
    expect(config.timezone).toBe('UTC');
    expect(config.jobs.recurringPayments.timezone).toBe('UTC');
    expect(config.auth).toEqual({baseUrl: 'http://localhost:8080', credentials: 'include'});
  });

  it('builds production CORS origins from trimmed environment values', () => {
    const config = createConfig({
      NODE_ENV: 'production',
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
    expect(createConfig({NODE_ENV: 'production'}).rateLimit.enabled).toBe(false);
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
