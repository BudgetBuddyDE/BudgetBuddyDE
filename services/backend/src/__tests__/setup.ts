import {resolve} from 'node:path';
import dotenv from 'dotenv';
import {vi} from 'vite-plus/test';
import {resetSharedMocks} from './mocks/reset';

dotenv.config({path: resolve(__dirname, '../../.env.test'), override: true});
// Deterministic credentials only for mocked unit-test infrastructure.
process.env.AUTH_SECRET = 'unit-test-secret-at-least-thirty-two-characters';
process.env.RESEND_API_KEY = 're_unit_test';
process.env.BASE_URL = 'http://localhost:9000';
process.env.AUTH_REDIS_URL = '';

// Every unit-test file in the shared module graph receives the same doubles.
// Test files configure the exported functions instead of replacing these modules.
vi.mock('../config', async importOriginal => {
  const actual = await importOriginal<typeof import('../config')>();
  const {createConfigMock} = await import('./mocks/configState');
  return {...actual, ...createConfigMock(actual.config)};
});
vi.mock('../db', async () => await import('./mocks/db'));
vi.mock('../db/redis', async () => await import('./mocks/redis'));
vi.mock('../lib/logger', async () => await import('./mocks/logger'));
vi.mock('../lib/s3', async () => await import('./mocks/s3'));
vi.mock('../lib/attachment', async () => await import('./mocks/attachment'));
vi.mock('../domain/cache', async () => await import('./mocks/cache'));
vi.mock('../middleware/cache.middleware', async importOriginal => {
  const actual = await importOriginal<typeof import('../middleware/cache.middleware')>();
  const {invalidateUserCaches} = await import('./mocks/cache');
  return {...actual, invalidateUserCaches};
});
vi.mock('../auth', async () => await import('./mocks/auth'));

vi.mock('ioredis', () => {
  const on = vi.fn();
  return {
    default: class RedisMock {
      status = 'ready';
      on = on;
      quit = vi.fn(async () => 'OK');
      disconnect = vi.fn();
      get = vi.fn(async () => null);
      set = vi.fn(async () => 'OK');
      setex = vi.fn(async () => 'OK');
      del = vi.fn(async () => 1);
      mget = vi.fn(async () => []);
      incr = vi.fn(async () => 1);
      call = vi.fn(async () => null);
      pipeline = vi.fn(() => ({set: vi.fn().mockReturnThis(), exec: vi.fn(async () => [])}));
    },
  };
});

beforeEach(() => {
  resetSharedMocks();
});
