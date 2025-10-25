import {describe, expect, test} from 'vitest';

import {LogLevel} from '../../logger';
import {getLogLevel} from './getLogLevel';

describe('getLogLevel', () => {
  describe('case insensitive parsing', () => {
    test('it should parse uppercase levels correctly', () => {
      expect(getLogLevel('FATAL')).toBe(LogLevel.FATAL);
      expect(getLogLevel('ERROR')).toBe(LogLevel.ERROR);
      expect(getLogLevel('WARN')).toBe(LogLevel.WARN);
      expect(getLogLevel('INFO')).toBe(LogLevel.INFO);
      expect(getLogLevel('DEBUG')).toBe(LogLevel.DEBUG);
      expect(getLogLevel('SILENT')).toBe(LogLevel.SILENT);
    });

    test('it should parse mixed case levels correctly', () => {
      expect(getLogLevel('Fatal')).toBe(LogLevel.FATAL);
      expect(getLogLevel('Error')).toBe(LogLevel.ERROR);
      expect(getLogLevel('Warn')).toBe(LogLevel.WARN);
      expect(getLogLevel('Info')).toBe(LogLevel.INFO);
      expect(getLogLevel('Debug')).toBe(LogLevel.DEBUG);
      expect(getLogLevel('Silent')).toBe(LogLevel.SILENT);
    });

    test('it should parse random case levels correctly', () => {
      expect(getLogLevel('fAtAl')).toBe(LogLevel.FATAL);
      expect(getLogLevel('eRrOr')).toBe(LogLevel.ERROR);
      expect(getLogLevel('WaRn')).toBe(LogLevel.WARN);
    });
  });

  describe('invalid log levels', () => {
    test('it should throw an error for unknown log level', () => {
      expect(() => getLogLevel('invalid')).toThrow('Unknown log level: invalid');
    });

    test('it should throw an error for empty string', () => {
      expect(() => getLogLevel('')).toThrow('Unknown log level: ');
    });

    test('it should throw an error for numeric string', () => {
      expect(() => getLogLevel('123')).toThrow('Unknown log level: 123');
    });

    test('it should throw an error for partial matches', () => {
      expect(() => getLogLevel('inf')).toThrow('Unknown log level: inf');
      expect(() => getLogLevel('deb')).toThrow('Unknown log level: deb');
    });

    test('it should throw an error for typos', () => {
      expect(() => getLogLevel('infoo')).toThrow('Unknown log level: infoo');
      expect(() => getLogLevel('warrn')).toThrow('Unknown log level: warrn');
    });
  });

  describe('edge cases', () => {
    test('it should handle levels wtesth it whtestesit pace', () => {
      expect(() => getLogLevel(' info ')).toThrow('Unknown log level:  info ');
      expect(() => getLogLevel('info ')).toThrow('Unknown log level: info ');
      expect(() => getLogLevel(' info')).toThrow('Unknown log level:  info');
    });
  });
});
