import {requestRouter} from './router.test-utils';
import {applicationRouter} from '../router/application.router';

const state = vi.hoisted(() => ({
  options: undefined as {prefix: string; sendCommand: (...args: string[]) => unknown} | undefined,
  call: vi.fn(),
}));
vi.mock('../config', () => ({
  config: {
    exportRateLimit: {enabled: true, keyPrefix: 'application-export', options: {limit: 4, windowMs: 60000}},
    export: {maxBytes: 1000, attachmentConcurrency: 1},
  },
}));
vi.mock('../db', () => ({db: {}}));
vi.mock('../db/redis', () => ({getRedisClient: () => ({call: state.call})}));
vi.mock('../lib/logger', () => {
  const logger = {error: vi.fn(), child: vi.fn()};
  logger.child.mockReturnValue(logger);
  return {logger};
});
vi.mock('rate-limit-redis', async () => {
  const {MemoryStore} = await import('express-rate-limit');
  return {
    default: class extends MemoryStore {
      constructor(options: NonNullable<typeof state.options>) {
        super();
        state.options = options;
      }
    },
  };
});

it('enforces the application export limit and uses its dedicated Redis namespace', async () => {
  for (let index = 0; index < 4; index++) {
    expect(
      (await requestRouter(applicationRouter, null, '/export?format=json&resources=categories', {method: 'GET'}))
        .status,
    ).toBe(401);
  }
  const response = await requestRouter(applicationRouter, null, '/export?format=json&resources=categories', {
    method: 'GET',
  });
  expect(response.status).toBe(429);
  expect(response.body).toMatchObject({message: 'Too many export requests. Please try again later.'});
  expect(state.options?.prefix).toBe('application-export');
  state.call.mockReturnValue('OK');
  expect(state.options?.sendCommand('GET', 'key')).toBe('OK');
  expect(state.call).toHaveBeenCalledWith('GET', 'key');
});
