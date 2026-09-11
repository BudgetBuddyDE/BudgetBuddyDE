import {describe, expect, it} from 'vitest';

import {CurrencyFormatter} from './CurrencyFormatter';
import {DateFormatter} from './DateFormatter';
import {DurationFormatter} from './DurationFormatter';

describe('CurrencyFormatter', () => {
  describe('formatBalance', () => {
    it('formats a number as EUR currency by default', () => {
      const result = CurrencyFormatter.formatBalance(1234.5);
      expect(result).toMatch(/1\.234,50/);
      expect(result).toMatch(/€/);
    });

    it('formats with a custom currency code', () => {
      const result = CurrencyFormatter.formatBalance(100, 'USD');
      expect(result).toMatch(/100/);
    });

    it('formats negative values correctly', () => {
      const result = CurrencyFormatter.formatBalance(-500);
      expect(result).toMatch(/-/);
      expect(result).toMatch(/500/);
    });
  });
});

describe('DateFormatter', () => {
  describe('formatWithPattern', () => {
    it('formats a date with the default dd.MM.yyyy pattern', () => {
      expect(DateFormatter.formatWithPattern(new Date(2024, 0, 15))).toBe('15.01.2024');
    });

    it('formats a date with a custom pattern', () => {
      expect(DateFormatter.formatWithPattern(new Date(2024, 5, 10), 'yyyy/MM/dd')).toBe('2024/06/10');
    });
  });

  describe('formatNullable', () => {
    it('formats a date when present', () => {
      expect(DateFormatter.formatNullable(new Date(2024, 0, 15))).toBe('15.01.2024');
    });

    it('returns the fallback for missing dates', () => {
      expect(DateFormatter.formatNullable(null)).toBe('Never');
      expect(DateFormatter.formatNullable(undefined, 'No date')).toBe('No date');
    });
  });
});

describe('DurationFormatter', () => {
  describe('formatMilliseconds', () => {
    it('returns null for missing durations', () => {
      expect(DurationFormatter.formatMilliseconds(null)).toBeNull();
      expect(DurationFormatter.formatMilliseconds(undefined)).toBeNull();
    });

    it('formats durations using compact units', () => {
      expect(DurationFormatter.formatMilliseconds(30 * 1000)).toBe('30s');
      expect(DurationFormatter.formatMilliseconds(5 * 60 * 1000)).toBe('5m');
      expect(DurationFormatter.formatMilliseconds(2 * 60 * 60 * 1000)).toBe('2h');
      expect(DurationFormatter.formatMilliseconds(3 * 24 * 60 * 60 * 1000)).toBe('3d');
    });
  });
});
