import {describe, expect, it} from 'vitest';
import {parseOccurrenceRangeParams} from './occurrenceRange';

describe('parseOccurrenceRangeParams', () => {
  const today = new Date(2026, 7, 28, 23, 30);

  it('defaults to the remaining local calendar month', () => {
    expect(parseOccurrenceRangeParams({}, today)).toEqual({
      dateFrom: '2026-08-28',
      dateTo: '2026-08-31',
      includePaused: false,
    });
  });

  it('parses occurrence deep links and optional paused schedules', () => {
    expect(
      parseOccurrenceRangeParams({dateFrom: '2026-09-01', dateTo: '2026-09-30', includePaused: 'true'}, today),
    ).toEqual({dateFrom: '2026-09-01', dateTo: '2026-09-30', includePaused: true});
  });

  it('replaces invalid and reversed ranges safely', () => {
    expect(parseOccurrenceRangeParams({dateFrom: 'invalid', dateTo: '2026-08-01'}, today)).toMatchObject({
      dateFrom: '2026-08-28',
      dateTo: '2026-08-28',
    });
  });
});
