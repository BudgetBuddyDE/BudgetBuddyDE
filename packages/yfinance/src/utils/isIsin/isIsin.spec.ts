import { isIsin } from './isIsin';

describe('isIsin', () => {
  it('should return true for valid ISIN', () => {
    expect(isIsin('US0378331005')).toBe(true);
  });

  it('should return false for invalid ISIN', () => {
    expect(isIsin('US037833100')).toBe(false);
  });
});
