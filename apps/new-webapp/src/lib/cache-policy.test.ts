import {describe, expect, it} from 'vitest';
import {FINANCE_DATA_MAX_AGE_MS, REFERENCE_DATA_MAX_AGE_MS, createCachePolicy, shouldRefresh} from './cache-policy';
import {formatCurrency, formatDate, formatPercent} from '@/utils/format';

describe('cache policies', () => {
  it('isolates keys by user, resource, and query dimensions', () => {
    const first = createCachePolicy('user-a', 'transactions', 'month=2026-07');
    const second = createCachePolicy('user-b', 'transactions', 'month=2026-07');
    expect(first.key).not.toBe(second.key);
    expect(first.scope).toBe('private-user');
    expect(first.maxAgeMs).toBe(FINANCE_DATA_MAX_AGE_MS);
    expect(createCachePolicy('user-a', 'categories').maxAgeMs).toBe(REFERENCE_DATA_MAX_AGE_MS);
  });

  it('refreshes stale and missing entries only', () => {
    expect(shouldRefresh(null, 10, 100)).toBe(true);
    expect(shouldRefresh(95, 10, 100)).toBe(false);
    expect(shouldRefresh(90, 10, 100)).toBe(true);
  });
});

describe('locale formatting', () => {
  it('formats money, dates, and rates consistently', () => {
    expect(formatCurrency(1234.5)).toContain('1,234.50');
    expect(formatDate(new Date('2026-07-15T12:00:00Z'))).toMatch(/15/);
    expect(formatPercent(0.25)).toContain('25');
  });
});
