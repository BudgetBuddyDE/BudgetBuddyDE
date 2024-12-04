import {parseNumber} from './transformBalance.util';

describe('transformBalance.util.ts', () => {
  it('should convert a positive balance with comma to a number', () => {
    const balance = '123,32';
    const result = parseNumber(balance);
    expect(result).toBe(123.32);
  });

  it('should convert a negative balance with comma to a number', () => {
    const balance = '-123,32';
    const result = parseNumber(balance);
    expect(result).toBe(-123.32);
  });

  it('should convert a balance with no comma to a number', () => {
    const balance = '123';
    const result = parseNumber(balance);
    expect(result).toBe(123);
  });

  it('should convert a negative balance with no comma to a number', () => {
    const balance = '-123';
    const result = parseNumber(balance);
    expect(result).toBe(-123);
  });

  it('should return NaN for an invalid balance string', () => {
    const balance = 'abc';
    const result = parseNumber(balance);
    expect(result).toBeNaN();
  });
});
