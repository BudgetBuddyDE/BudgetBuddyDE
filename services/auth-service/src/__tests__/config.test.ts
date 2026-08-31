import {BackendConfig} from '@budgetbuddyde/core/config/BackendConfig';
import {EnvironmentNotSetError} from '@budgetbuddyde/core/error/EnvironmentNotSetError';
import {describe, expect, it} from 'vitest';
import {AppConfig} from '../config';

function createConfig(environment: NodeJS.ProcessEnv = {}): AppConfig {
  return AppConfig.fromEnvironment({
    DATABASE_URL: 'postgres://localhost/budgetbuddy',
    AUTH_SECRET: 'auth-secret',
    RESEND_API_KEY: 'resend-api-key',
    ...environment,
  });
}

describe('AppConfig', () => {
  it('extends BackendConfig and applies auth-service defaults', () => {
    const config = createConfig({PORT: '8081', TIMEZONE: 'UTC'});

    expect(config).toBeInstanceOf(BackendConfig);
    expect(config.port).toBe(8081);
    expect(config.baseUrl).toBe('http://localhost');
    expect(config.jobs.timezone).toBe('UTC');
    expect(config.auth.trustedOrigins).toEqual(['http://localhost:3000']);
  });

  it('builds trimmed production origins and enables Redis-backed rate limits', () => {
    const config = createConfig({
      NODE_ENV: 'production',
      TRUSTED_ORIGINS: ' https://budget-buddy.de , https://demo.budget-buddy.de ',
      REDIS_URL: 'redis://localhost:6379',
    });

    expect(config.cors.origin).toEqual(['https://budget-buddy.de', 'https://demo.budget-buddy.de']);
    expect(config.auth.trustedOrigins).toEqual(['https://budget-buddy.de', 'https://demo.budget-buddy.de']);
    expect(config.rateLimit.enabled).toBe(true);
    expect(config.exportRateLimit.enabled).toBe(true);
  });

  it('requires trusted origins in production', () => {
    expect(() => createConfig({NODE_ENV: 'production'})).toThrow(EnvironmentNotSetError);
  });

  it('keeps Redis optional and preserves database zero', () => {
    const config = createConfig({REDIS_URL: 'redis://localhost:6379', REDIS_DB: '0'});

    expect(config.getRequiredRedisConfig()).toEqual({url: 'redis://localhost:6379', database: 0});
    expect(createConfig().redis.url).toBeUndefined();
    expect(createConfig({NODE_ENV: 'production', TRUSTED_ORIGINS: 'https://budget-buddy.de'}).rateLimit.enabled).toBe(
      false,
    );
    expect(() => createConfig().getRequiredRedisConfig()).toThrow(EnvironmentNotSetError);
  });

  it('centralizes Better Auth flags and OAuth credentials', () => {
    const config = createConfig({
      DISABLE_CSRF_CHECK: 'true',
      DISABLE_SIGNUP: 'true',
      GITHUB_CLIENT_ID: ' github-id ',
      GITHUB_CLIENT_SECRET: ' github-secret ',
      GOOGLE_CLIENT_ID: 'google-id',
    });

    expect(config.auth.disableCsrfCheck).toBe(true);
    expect(config.auth.disableSignUp).toBe(true);
    expect(config.auth.socialProviders.github).toEqual({clientId: 'github-id', clientSecret: 'github-secret'});
    expect(config.auth.socialProviders.google).toEqual({clientId: 'google-id', clientSecret: undefined});
  });

  it('rejects blank required values', () => {
    expect(() => createConfig({AUTH_SECRET: ' '})).toThrow(EnvironmentNotSetError);
  });
});
