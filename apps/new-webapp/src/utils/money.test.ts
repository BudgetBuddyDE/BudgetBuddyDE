import {describe, expect, it} from 'vitest';
import {formatCurrency, minorUnitsToApiAmount, parseMoneyToMinorUnits} from './money';

describe('money utilities', () => {
  it.each([
    ['0', 0],
    ['12', 1200],
    ['12.3', 1230],
    ['12,34', 1234],
    [' 99.99 ', 9999],
  ])('parses %s without floating-point arithmetic', (value, expected) => {
    expect(parseMoneyToMinorUnits(value)).toBe(expected);
  });

  it.each(['', '-1', '1.234', '1e3', 'Infinity', '900719925474100'])('rejects unsafe input %s', value => {
    expect(parseMoneyToMinorUnits(value)).toBeNull();
  });

  it('applies transaction type only at the API boundary', () => {
    expect(minorUnitsToApiAmount(1234, 'income')).toBe(12.34);
    expect(minorUnitsToApiAmount(1234, 'expense')).toBe(-12.34);
    expect(() => minorUnitsToApiAmount(1.5, 'income')).toThrow(RangeError);
  });

  it('formats with the requested locale and currency', () => {
    expect(formatCurrency(1234.5, 'en-US', 'EUR')).toContain('1,234.50');
  });
});
