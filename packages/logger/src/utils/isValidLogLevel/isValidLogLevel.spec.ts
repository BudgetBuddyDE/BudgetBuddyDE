import {describe, expect, test} from 'vitest';
import {isValidLogLevel} from './isValidLogLevel';

describe('isValidLogLevel', () => {
  test('it returns true for valid log level strings (case-insensitive)', () => {
    expect(isValidLogLevel('ERROR')).toBe(true);
    expect(isValidLogLevel('error')).toBe(true);
    expect(isValidLogLevel('Warn')).toBe(true);
    expect(isValidLogLevel('INFO')).toBe(true);
    expect(isValidLogLevel('debug')).toBe(true);
    expect(isValidLogLevel('SILENT')).toBe(true);
  });

  test('it returns false for invalid log level strings', () => {
    expect(isValidLogLevel('TRACE')).toBe(false);
    expect(isValidLogLevel('VERBOSE')).toBe(false);
    expect(isValidLogLevel('')).toBe(false);
    expect(isValidLogLevel('err')).toBe(false);
    expect(isValidLogLevel('warnning')).toBe(false);
    expect(isValidLogLevel('123')).toBe(false);
    expect(isValidLogLevel('INFOO')).toBe(false);
  });
});
