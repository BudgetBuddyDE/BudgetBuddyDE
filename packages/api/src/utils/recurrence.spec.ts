import {describe, expect, it} from 'vitest';
import {isOccurrenceDate, listOccurrenceDates, nextOccurrenceOnOrAfter} from './recurrence';

describe('recurrence', () => {
  it.each([
    ['daily', ['2026-01-01', '2026-01-02', '2026-01-03']],
    ['weekly', ['2026-01-01', '2026-01-08']],
    ['monthly', ['2026-01-01', '2026-02-01', '2026-03-01']],
    ['quarterly', ['2026-01-01', '2026-04-01']],
    ['yearly', ['2026-01-01', '2027-01-01']],
  ] as const)('lists %s occurrences with inclusive bounds', (executionPlan, expected) => {
    expect(listOccurrenceDates({executionPlan, startsOn: '2026-01-01'}, '2026-01-01', expected.at(-1)!)).toEqual(
      expected,
    );
  });

  it('handles biweekly schedules across a year boundary and never emits before the start', () => {
    const schedule = {executionPlan: 'biweekly', startsOn: '2026-12-20'} as const;
    expect(listOccurrenceDates(schedule, '2026-01-01', '2027-01-31')).toEqual([
      '2026-12-20',
      '2027-01-03',
      '2027-01-17',
      '2027-01-31',
    ]);
  });

  it('anchors month schedules to the preferred day after end-of-month clamping', () => {
    const schedule = {executionPlan: 'monthly', startsOn: '2025-01-31'} as const;
    expect(listOccurrenceDates(schedule, '2025-01-01', '2025-04-30')).toEqual([
      '2025-01-31',
      '2025-02-28',
      '2025-03-31',
      '2025-04-30',
    ]);
    expect(nextOccurrenceOnOrAfter(schedule, '2025-03-01')).toBe('2025-03-31');
  });

  it('clamps leap-day yearly schedules and restores leap day in leap years', () => {
    const schedule = {executionPlan: 'yearly', startsOn: '2024-02-29'} as const;
    expect(listOccurrenceDates(schedule, '2024-01-01', '2028-12-31')).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29',
    ]);
  });

  it('checks occurrences and returns an empty range when from is after to', () => {
    const schedule = {executionPlan: 'quarterly', startsOn: '2026-01-31'} as const;
    expect(isOccurrenceDate(schedule, '2026-04-30')).toBe(true);
    expect(isOccurrenceDate(schedule, '2026-05-31')).toBe(false);
    expect(listOccurrenceDates(schedule, '2026-06-01', '2026-05-01')).toEqual([]);
  });
});
