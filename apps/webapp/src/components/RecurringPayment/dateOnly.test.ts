import {describe, expect, it} from 'vitest';
import {endOfLocalMonthDateOnly, formatDateOnlyForDisplay, formatLocalDateOnly, parseLocalDateOnly} from './dateOnly';

describe('recurring payment date-only helpers', () => {
  it('formats local calendar components without UTC conversion', () => {
    expect(formatLocalDateOnly(new Date(2026, 7, 28, 23, 30))).toBe('2026-08-28');
  });

  it('parses date-only values at local midnight', () => {
    const date = parseLocalDateOnly('2026-03-29');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 2, 29, 0]);
    expect(formatDateOnlyForDisplay('2026-03-29')).toBe('29/03/2026');
  });

  it('rejects invalid calendar dates and finds the local month end', () => {
    expect(() => parseLocalDateOnly('2026-02-30')).toThrow(RangeError);
    expect(endOfLocalMonthDateOnly(new Date(2024, 1, 10))).toBe('2024-02-29');
  });
});
