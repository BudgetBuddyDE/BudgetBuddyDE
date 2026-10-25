import {afterEach, describe, expect, it, vi} from 'vite-plus/test';
import type {ApiKey} from './types';
import {getApiKeySummary} from './utils';

const makeApiKey = (overrides: Partial<ApiKey> = {}): ApiKey =>
  ({
    id: 'key-1',
    configId: 'default',
    name: 'Test key',
    start: 'bb-test',
    prefix: 'bb-',
    key: 'hashed-key',
    referenceId: 'user-1',
    refillInterval: null,
    refillAmount: null,
    lastRefillAt: null,
    enabled: true,
    rateLimitEnabled: false,
    rateLimitTimeWindow: null,
    rateLimitMax: null,
    requestCount: 0,
    remaining: null,
    lastRequest: null,
    expiresAt: null,
    createdAt: new Date('2026-10-10T10:00:00.000Z'),
    updatedAt: new Date('2026-10-10T10:00:00.000Z'),
    metadata: null,
    ...overrides,
  }) as ApiKey;

describe('getApiKeySummary', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts disabled and expired keys once and finds the newest creation date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00.000Z'));

    const keys = [
      makeApiKey({id: 'active'}),
      makeApiKey({id: 'disabled', enabled: false}),
      makeApiKey({id: 'expired', expiresAt: new Date('2026-10-01T10:00:00.000Z')}),
      makeApiKey({
        id: 'disabled-and-expired',
        enabled: false,
        expiresAt: new Date('2026-10-01T10:00:00.000Z'),
        createdAt: new Date('2026-10-11T11:00:00.000Z'),
      }),
    ];

    expect(getApiKeySummary(keys)).toEqual({
      activeCount: 1,
      inactiveCount: 3,
      lastCreated: new Date('2026-10-11T11:00:00.000Z'),
    });
  });

  it('returns zero counts and no last-created date for an empty list', () => {
    expect(getApiKeySummary([])).toEqual({activeCount: 0, inactiveCount: 0, lastCreated: null});
  });
});
