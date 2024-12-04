import {describe, expect, it} from 'vitest';

import {Formatter} from './Formatter.service';

describe('Formatter.service.ts', () => {
  describe('shortenNumber', () => {
    it('should shorten a number greater than or equal to 1 billion', () => {
      const number = 1500000000;
      const result = Formatter.shortenNumber(number);
      expect(result).toBe('1.50 Mrd.');
    });

    it('should shorten a number greater than or equal to 1 million', () => {
      const number = 2500000;
      const result = Formatter.shortenNumber(number);
      expect(result).toBe('2.50 Mio.');
    });

    it('should shorten a number greater than or equal to 1 thousand', () => {
      const number = 3500;
      const result = Formatter.shortenNumber(number);
      expect(result).toBe('3.50 K.');
    });

    it('should not shorten a number less than 1 thousand', () => {
      const number = 500;
      const result = Formatter.shortenNumber(number);
      expect(result).toBe('500');
    });

    it('should handle negative numbers correctly', () => {
      const number = -2000000;
      const result = Formatter.shortenNumber(number);
      expect(result).toBe('-2.00 Mio.');
    });
  });
});
