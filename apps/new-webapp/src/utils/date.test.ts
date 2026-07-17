import {describe, expect, it} from 'vitest';
import {formatDate, formatPeriodLabel, parseLocalDate, shiftMonth, toDateInputValue} from './date';

describe('date utilities', () => {
  it('parses a calendar day at local noon to avoid boundary drift', () => {
    const date = parseLocalDate('2026-07-16');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(6);
    expect(date?.getDate()).toBe(16);
    expect(date?.getHours()).toBe(12);
  });

  it.each(['2026-02-30', '16.07.2026', ''])('rejects invalid date %s', value => {
    expect(parseLocalDate(value)).toBeNull();
  });

  it('moves across month and year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(formatPeriodLabel('2026-07', 'en-US')).toBe('July 2026');
  });

  it('serializes and formats valid dates', () => {
    const date = new Date(2026, 6, 16, 12);
    expect(toDateInputValue(date)).toBe('2026-07-16');
    expect(formatDate(date, 'en-US')).toContain('Jul');
  });
});
