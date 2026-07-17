import {describe, expect, it} from 'vitest';
import {advanceRecurringDate, nextRecurringDateAfter} from '../utils/recurringDate';

describe('advanceRecurringDate', () => {
  it.each([
    ['monthly', new Date(2026, 1, 28)],
    ['quarterly', new Date(2026, 3, 30)],
    ['yearly', new Date(2027, 0, 31)],
  ] as const)('advances %s schedules and clamps unavailable calendar days', (interval, expected) => {
    expect(advanceRecurringDate(new Date(2026, 0, 31), interval)).toEqual(expected);
  });

  it('skips every missed interval instead of executing repeatedly', () => {
    expect(nextRecurringDateAfter(new Date(2026, 0, 15), 'monthly', new Date(2026, 3, 20))).toEqual(
      new Date(2026, 4, 15),
    );
  });
});
