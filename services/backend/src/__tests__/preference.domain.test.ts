import {PgDialect} from 'drizzle-orm/pg-core';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vite-plus/test';

const mocks = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  inserted: [] as Array<Record<string, unknown>>,
  updates: [] as Array<Record<string, unknown>>,
  where: vi.fn(),
  invalidate: vi.fn(),
  warn: vi.fn(),
  insertError: null as Error | null,
  skipInsert: false,
  concurrentRow: null as Record<string, unknown> | null,
}));

vi.mock('../domain/cache', () => ({invalidateDomainMutation: mocks.invalidate}));
vi.mock('../lib/logger', () => ({logger: {warn: mocks.warn}}));
vi.mock('../db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: (predicate: Parameters<PgDialect['sqlToQuery']>[0]) => {
          const ownerId = new PgDialect().sqlToQuery(predicate).params[0];
          const rows = mocks.rows.filter(row => row.ownerId === ownerId);
          return {limit: async () => rows};
        },
      }),
    }),
    insert: () => ({
      values: (value: Record<string, unknown>) => {
        return {
          onConflictDoNothing: async () => {
            if (mocks.insertError) throw mocks.insertError;
            if (mocks.concurrentRow) mocks.rows.push(mocks.concurrentRow);
            mocks.inserted.push(value);
            if (!mocks.skipInsert && !mocks.rows.some(row => row.ownerId === value.ownerId))
              mocks.rows.push({...current, ...value});
          },
        };
      },
    }),
    update: () => ({
      set: (value: Record<string, unknown>) => {
        mocks.updates.push(value);
        return {
          where: (predicate: unknown) => {
            mocks.where(predicate);
            return {returning: async () => [{...mocks.rows[0], ...value}]};
          },
        };
      },
    }),
  },
}));

import * as preference from '../domain/preference';
import {initializePreferences} from '../lib/preferences';

const current = {
  ownerId: 'user-a',
  onboardingCompleted: false,
  language: 'en_US',
  timeZone: 'Europe/Berlin',
  currency: 'EUR',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('preference domain', () => {
  beforeEach(() => {
    mocks.rows = [{...current}];
    mocks.inserted = [];
    mocks.updates = [];
    mocks.insertError = null;
    mocks.skipInsert = false;
    mocks.concurrentRow = null;
    vi.clearAllMocks();
  });

  afterEach(() => vi.restoreAllMocks());

  it('reads only the authenticated user preference', async () => {
    mocks.rows.unshift({...current, ownerId: 'other-user', language: 'de_DE'});
    expect(await preference.get('user-a')).toMatchObject({status: 200, data: {ownerId: 'user-a'}});
    expect(mocks.warn).not.toHaveBeenCalled();
    expect(mocks.inserted).toHaveLength(0);
  });

  it('initializes missing records as completed legacy accounts', async () => {
    mocks.rows = [];
    const result = await preference.get('legacy-user');

    expect(mocks.inserted).toEqual([{ownerId: 'legacy-user', onboardingCompleted: true}]);
    expect(result).toMatchObject({status: 200, data: {ownerId: 'legacy-user', onboardingCompleted: true}});
    expect(mocks.warn).toHaveBeenCalledExactlyOnceWith('User preferences missing; initializing legacy defaults', {
      userId: 'legacy-user',
      event: 'preferences.missing',
    });
    expect(result.data).toMatchObject({language: 'en_US', timeZone: 'Europe/Berlin', currency: 'EUR'});
  });

  it('preserves settings when concurrent reads initialize the same account', async () => {
    mocks.rows = [];
    const results = await Promise.all([preference.get('legacy-user'), preference.get('legacy-user')]);
    expect(mocks.rows).toHaveLength(1);
    expect(results[0].data).toEqual(results[1].data);
  });

  it('propagates initialization failures instead of returning fabricated defaults', async () => {
    mocks.rows = [];
    mocks.insertError = new Error('Database unavailable');
    await expect(preference.get('user-a')).rejects.toThrow('Database unavailable');
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it('conservatively completes onboarding when repairing a failed new-user initialization', async () => {
    mocks.rows = [];
    mocks.insertError = new Error('Database unavailable');
    await expect(initializePreferences('new-user')).rejects.toThrow('Database unavailable');

    mocks.insertError = null;
    expect(await preference.get('new-user')).toMatchObject({
      status: 200,
      data: {ownerId: 'new-user', onboardingCompleted: true},
    });
    expect(mocks.warn).toHaveBeenCalledWith('User preferences missing; initializing legacy defaults', {
      userId: 'new-user',
      event: 'preferences.missing',
    });
  });

  it('returns a concurrently created preference without overwriting it', async () => {
    mocks.rows = [];
    mocks.concurrentRow = {...current, language: 'de_DE', currency: 'USD'};
    expect(await preference.get('user-a')).toMatchObject({
      data: {onboardingCompleted: false, language: 'de_DE', currency: 'USD'},
    });
    expect(mocks.rows).toHaveLength(1);
  });

  it('fails if initialization does not produce a persisted record', async () => {
    mocks.rows = [];
    mocks.skipInsert = true;
    await expect(preference.get('user-a')).rejects.toThrow('Unable to initialize user preferences');
  });

  it('updates only supplied fields for the authenticated owner and invalidates preferences', async () => {
    await preference.update('user-a', {language: 'de_DE'});

    expect(mocks.updates[0]).toMatchObject({language: 'de_DE'});
    expect(mocks.updates[0]).not.toHaveProperty('currency');
    expect(new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0]).params).toEqual(['user-a']);
    expect(mocks.invalidate).toHaveBeenCalledExactlyOnceWith('user-a', '/api/preference');
  });

  it('rejects invalid input without writing or invalidating', async () => {
    expect((await preference.update('user-a', {ownerId: 'user-b', onboardingCompleted: true})).status).toBe(400);
    expect(mocks.updates).toHaveLength(0);
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
});
