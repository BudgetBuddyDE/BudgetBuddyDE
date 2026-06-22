import {describe, expect, it} from 'vitest';

import {CurrencyFormatter} from './CurrencyFormatter';
import {DateFormatter} from './DateFormatter';
import {DurationFormatter} from './DurationFormatter';
import {PercentageFormatter} from './PercentageFormatte';

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

  describe('shortenNumber', () => {
    it('does not shorten numbers below 1000', () => {
      expect(CurrencyFormatter.shortenNumber(999)).toBe('999');
    });

    it('shortens thousands with "K."', () => {
      expect(CurrencyFormatter.shortenNumber(1500)).toBe('1.50 K.');
    });

    it('shortens millions with "Mio."', () => {
      expect(CurrencyFormatter.shortenNumber(2000000)).toBe('2.00 Mio.');
    });

    it('shortens billions with "Mrd."', () => {
      expect(CurrencyFormatter.shortenNumber(3000000000)).toBe('3.00 Mrd.');
    });

    it('handles negative numbers', () => {
      expect(CurrencyFormatter.shortenNumber(-1500)).toBe('-1.50 K.');
    });
  });
});

describe('DateFormatter', () => {
  describe('getMonthFromDate', () => {
    it('returns the correct month name for January', () => {
      expect(DateFormatter.getMonthFromDate(new Date(2024, 0, 1))).toBe('January');
    });

    it('returns the correct month name for December', () => {
      expect(DateFormatter.getMonthFromDate(new Date(2024, 11, 1))).toBe('December');
    });
  });

  describe('shortMonthName', () => {
    it('returns 3-character abbreviation by default', () => {
      expect(DateFormatter.shortMonthName(new Date(2024, 0, 1))).toBe('Jan');
    });

    it('respects custom maxLength', () => {
      expect(DateFormatter.shortMonthName(new Date(2024, 3, 1), 5)).toBe('April');
    });
  });

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

describe('PercentageFormatter', () => {
  describe('format', () => {
    it('formats a percentage with 2 decimal places', () => {
      expect(PercentageFormatter.format(42.5)).toBe('42.50 %');
    });

    it('formats zero correctly', () => {
      expect(PercentageFormatter.format(0)).toBe('0.00 %');
    });

    it('formats negative percentages', () => {
      expect(PercentageFormatter.format(-10.25)).toBe('-10.25 %');
    });
  });
});
