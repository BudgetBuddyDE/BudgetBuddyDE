import {describe, expect, it} from 'vitest';
import {buildCacheKey, cachePolicies, resourcesInvalidatedBy} from './cache-policy';

describe('cache policy', () => {
  it('keys private data by identity and every query dimension', () => {
    const key = buildCacheKey({
      resource: 'transactions',
      userId: 'user-1',
      householdId: 'home-1',
      from: '2026-01-01',
      to: '2026-01-31',
      filters: {type: 'expense', category: ['b', 'a'], search: 'rent'},
      sort: 'amount',
      order: 'desc',
      page: 2,
      pageSize: 25,
    });
    expect(key).toContain('user:user-1');
    expect(key).toContain('household:home-1');
    expect(key).toContain('range:2026-01-01..2026-01-31');
    expect(key).toContain('category=a%2Cb');
    expect(key).toContain('sort:amount:desc');
    expect(key).toContain('page:2:25');
    expect(key).not.toBe(buildCacheKey({resource: 'transactions', userId: 'user-2'}));
  });

  it('keeps security-sensitive data fresh and session-scoped', () => {
    expect(cachePolicies.session).toMatchObject({
      freshnessSeconds: 0,
      privacy: 'private-session',
      staleBehavior: 'block',
    });
    expect(cachePolicies['api-keys'].privacy).toBe('private-session');
  });

  it('invalidates every derived resource after a transaction mutation', () => {
    expect(resourcesInvalidatedBy('transactions')).toEqual(
      expect.arrayContaining(['transactions', 'budgets', 'analytics', 'reports', 'attachments']),
    );
  });
});
