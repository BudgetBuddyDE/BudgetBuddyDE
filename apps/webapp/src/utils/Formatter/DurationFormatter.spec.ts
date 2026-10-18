import {describe, expect, it} from 'vitest';
import {DurationFormatter} from './DurationFormatter';

describe('DurationFormatter', () => {
  it.each([null, undefined, 0])('returns null for an absent duration: %s', value => {
    expect(DurationFormatter.formatMilliseconds(value)).toBeNull();
  });

  it.each([
    [1000, '1s'],
    [1499, '1s'],
    [1500, '2s'],
    [60000, '1m'],
    [3600000, '1h'],
    [86400000, '1d'],
    [129600000, '2d'],
  ])('preserves default abbreviations and rounding for %s milliseconds', (value, expected) => {
    expect(DurationFormatter.formatMilliseconds(value)).toBe(expected);
  });

  it.each([
    [1000, '1sec'],
    [60000, '1min'],
    [3600000, '1hr'],
    [86400000, '1day'],
  ])('supports localized abbreviations for %s milliseconds without changing defaults', (value, expected) => {
    expect(
      DurationFormatter.formatMilliseconds(value, {seconds: 'sec', minutes: 'min', hours: 'hr', days: 'day'}),
    ).toBe(expected);
    expect(DurationFormatter.formatMilliseconds(1000)).toBe('1s');
  });
});
