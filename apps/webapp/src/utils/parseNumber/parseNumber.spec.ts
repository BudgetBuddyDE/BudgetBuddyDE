import {describe, expect, test} from 'vitest';

import {parseNumber} from './parseNumber';

describe('parseNumber', () => {
  test('converts a positive number with comma to a decimal', () => {
    expect(parseNumber('123,32')).toBeCloseTo(123.32);
  });

  test('converts a negative number with comma to a decimal', () => {
    expect(parseNumber('-123,32')).toBeCloseTo(-123.32);
  });

  test('converts a whole number string without delimiters', () => {
    expect(parseNumber('123')).toEqual(123);
  });

  test('handles a period as the decimal separator', () => {
    expect(parseNumber('123.45')).toEqual(123.45);
  });

  test('returns NaN for non-numeric input', () => {
    expect(parseNumber('abc')).toBeNaN();
  });

  test('returns 0 for "0"', () => {
    expect(parseNumber('0')).toEqual(0);
  });
});
