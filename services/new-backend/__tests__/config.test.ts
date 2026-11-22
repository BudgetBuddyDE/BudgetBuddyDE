import {afterEach, expect, expectTypeOf, it, vi} from 'vite-plus/test';
import {ZodError} from 'zod';
import {BackendConfig, invalidConfigFields, parseBackendEnvironment} from '../lib/config';

afterEach(() => vi.unstubAllEnvs());

it('parses required values and supplies typed defaults for optional inputs', () => {
  const config = parseBackendEnvironment({
    DATABASE_URL: 'postgres://localhost/service',
    AUTH_SECRET: 'test-secret',
    REDIS_URL: 'redis://localhost',
    AUTH_REDIS_URL: 'rediss://localhost',
  });

  expect(config.database.connectionString).toBe('postgres://localhost/service');
  expect(config.auth).toMatchObject({
    baseUrl: 'http://localhost:9100',
    trustedOrigins: ['http://localhost:3000'],
    disableSignUp: false,
  });
  expect(config.logging).toEqual({runtime: 'development', level: 'info'});
  expect(config.redis.kv?.db).toBe(1);
  expect(config.redis.auth?.db).toBe(0);
  expectTypeOf(config.database.connectionString).toEqualTypeOf<string>();
  expectTypeOf(config.redis.auth?.url).toEqualTypeOf<string | undefined>();
  expectTypeOf(config.auth.disableSignUp).toEqualTypeOf<boolean>();
});

it('requires explicit production origins and reports only field names', () => {
  const config = parseBackendEnvironment({NODE_ENV: 'production', AUTH_SECRET: 'test-secret'});

  expect(() => config.auth).toThrow(ZodError);
  try {
    void config.auth;
  } catch (error) {
    if (!(error instanceof ZodError)) throw error;
    expect(invalidConfigFields(error)).toEqual(['BASE_URL', 'TRUSTED_ORIGINS']);
  }
});

it('keeps readiness configuration usable without auth or mail secrets', () => {
  const config = parseBackendEnvironment({
    DATABASE_URL: 'postgres://localhost/service',
    REDIS_URL: 'redis://localhost',
    REDIS_DB: '2',
  });

  expect(() => config.auth).toThrow(ZodError);
  expect(() => config.email).toThrow(ZodError);
  expect(config.database.connectionString).toBe('postgres://localhost/service');
  expect(config.redis.kv?.db).toBe(2);
  expect(config.redis.auth).toBeUndefined();
});

it('keeps malformed HTTP origins isolated to auth configuration', () => {
  const config = parseBackendEnvironment({AUTH_SECRET: 'test-secret', BASE_URL: 'not a URL'});

  expect(() => config.auth).toThrow(ZodError);
  expect(config.logging.level).toBe('info');
});

it('rejects invalid dependency values without disabling unrelated sections', () => {
  const config = parseBackendEnvironment({DATABASE_URL: 'https://localhost', AUTH_REDIS_URL: 'https://localhost'});

  expect(() => config.database).toThrow(ZodError);
  expect(config.redis.authConfigured).toBe(true);
  expect(() => config.redis.auth).toThrow(ZodError);
  expect(config.redis.kv).toBeUndefined();
  expect(config.logging.level).toBe('info');
});

it('normalizes production origins and enables only complete OAuth providers', () => {
  const config = parseBackendEnvironment({
    NODE_ENV: 'production',
    AUTH_SECRET: 'test-secret',
    BASE_URL: 'https://api.example.test/',
    TRUSTED_ORIGINS: ' https://app.example.test/, https://admin.example.test ',
    DISABLE_SIGNUP: 'true',
    GITHUB_CLIENT_ID: 'github-id',
    GOOGLE_CLIENT_ID: 'google-id',
    GOOGLE_CLIENT_SECRET: 'google-secret',
  });

  expect(config.auth).toMatchObject({
    baseUrl: 'https://api.example.test',
    trustedOrigins: ['https://app.example.test', 'https://admin.example.test'],
    disableSignUp: true,
    github: undefined,
    google: {clientId: 'google-id', clientSecret: 'google-secret'},
  });
});

it('keeps a single snapshot of the runtime environment', () => {
  vi.stubEnv('LOG_LEVEL', 'debug');
  const config = BackendConfig.getInstance();
  vi.stubEnv('LOG_LEVEL', 'error');

  expect(BackendConfig.getInstance()).toBe(config);
  expect(config.logging.level).toBe('debug');
  expect(JSON.stringify(config)).toBe('{}');
});
