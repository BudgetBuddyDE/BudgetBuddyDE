import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {createLogger, LogLevel, type LogMeta, sanitizeLogMeta, shouldPublishLog} from './logger';
import {ConsoleTransport} from './transport';

describe('shouldLog (matrix)', () => {
  test('it validates all combinations of currentLevel and logLevel', () => {
    const allLogLevels = [LogLevel.SILENT, LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    allLogLevels.forEach(currentLevel => {
      allLogLevels.forEach(logLevel => {
        const result = shouldPublishLog(currentLevel, logLevel);

        const expected = currentLevel === LogLevel.SILENT ? false : logLevel <= currentLevel;

        if (result !== expected) {
          // Should throw an error if the result does not match the expected value
          throw new Error(
            `shouldPublishLog(${LogLevel[currentLevel]}, ${LogLevel[logLevel]}) should be ${expected} but got ${result}`,
          );
        }
        expect(result).toBe(expected);
      });
    });
  });
});

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Use fake timers for testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('createLogger', () => {
    test('should create a logger with default options', () => {
      const logger = createLogger({label: 'test-logger'});

      expect(logger).toBeDefined();
      expect(logger.getLogLevel()).toBe(LogLevel.INFO);
      expect(logger.getLogLevelName()).toBe('INFO');
    });

    test('should create a logger with custom log level', () => {
      const logger = createLogger({
        label: 'test-logger',
        level: LogLevel.WARN,
      });

      expect(logger.getLogLevel()).toBe(LogLevel.WARN);
      expect(logger.getLogLevelName()).toBe('WARN');
    });

    test('should create a disabled logger', () => {
      const logger = createLogger({
        label: 'test-logger',
        disabled: true,
      });

      logger.info('This should not be logged');
      vi.runAllTimers();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    test('should add default ConsoleTransport when no transports provided', () => {
      createLogger({label: 'test-logger'});
      vi.runAllTimers();

      // Should log a warning about no transports configured
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('No transports configured'));
    });
  });

  describe('log levels', () => {
    test('should have all log level methods available', () => {
      const logger = createLogger({label: 'test-logger'});

      expect(typeof logger.fatal).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    test('should log messages at appropriate levels', () => {
      const transport = new ConsoleTransport({
        label: 'test-logger',
        level: LogLevel.DEBUG, // Set transport level to match logger level
        batchSize: 1, // Send immediately
        debounceMs: 0, // No debounce
      });
      const logger = createLogger({
        label: 'test-logger',
        level: LogLevel.DEBUG,
        transports: [transport],
      });

      logger.fatal('Fatal message');
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // fatal and error
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // info and debug
    });

    test('should respect log level filtering', () => {
      const transport = new ConsoleTransport({
        label: 'test-logger',
        batchSize: 1,
        debounceMs: 0,
      });
      const logger = createLogger({
        label: 'test-logger',
        level: LogLevel.WARN,
        transports: [transport],
      });

      logger.fatal('Fatal message');
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message'); // Should not be logged
      logger.debug('Debug message'); // Should not be logged

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // fatal and error
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // warn
      expect(consoleLogSpy).not.toHaveBeenCalled(); // info and debug should not be logged
    });

    test('should handle SILENT log level', () => {
      const transport = new ConsoleTransport({
        label: 'test-logger',
        batchSize: 1,
        debounceMs: 0,
      });
      const logger = createLogger({
        label: 'test-logger',
        level: LogLevel.SILENT,
        transports: [transport],
      });

      logger.fatal('Fatal message');
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('setLogLevel', () => {
    test('should change log level dynamically', () => {
      const transport = new ConsoleTransport({
        label: 'test-logger',
        batchSize: 1,
        debounceMs: 0,
      });
      const logger = createLogger({
        label: 'test-logger',
        level: LogLevel.INFO,
        transports: [transport],
      });

      expect(logger.getLogLevel()).toBe(LogLevel.INFO);

      logger.setLogLevel(LogLevel.ERROR);
      expect(logger.getLogLevel()).toBe(LogLevel.ERROR);
      expect(logger.getLogLevelName()).toBe('ERROR');

      // Test that the new level is applied
      logger.warn('Warning message'); // Should not be logged
      logger.error('Error message'); // Should be logged

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('message formatting', () => {
    test('should log simple messages', () => {
      const transport = new ConsoleTransport({
        label: 'test-logger',
        batchSize: 1,
        debounceMs: 0,
      });
      const logger = createLogger({
        label: 'test-logger',
        transports: [transport],
      });

      logger.info('Simple message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Simple message'));
    });

    test('should format messages with parameters', () => {
      const transport = new ConsoleTransport({
        label: 'test-logger',
        batchSize: 1,
        debounceMs: 0,
      });
      const logger = createLogger({
        label: 'test-logger',
        transports: [transport],
      });

      logger.info('Hello %s, you have %d messages', 'World', 5);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Hello World, you have 5 messages'));
    });

    test('should handle metadata', () => {
      const transport = new ConsoleTransport({
        label: 'test-logger',
        batchSize: 1,
        debounceMs: 0,
      });
      const logger = createLogger({
        label: 'test-logger',
        transports: [transport],
      });

      const metadata: LogMeta = {userId: 123, action: 'login'};
      logger.info('User action', metadata);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('User action'), metadata);
    });

    test('should hide metadata when hideMeta is true', () => {
      const transport = new ConsoleTransport({
        label: 'test-logger',
        hideMeta: true,
        batchSize: 1,
        debounceMs: 0,
      });
      const logger = createLogger({
        label: 'test-logger',
        hideMeta: true,
        transports: [transport],
      });

      const metadata: LogMeta = {userId: 123, action: 'login'};
      logger.info('User action', metadata);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('User action'));
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.anything(), metadata);
    });
  });

  describe('child logger', () => {
    test('should create a child logger with inherited properties', () => {
      const transport = new ConsoleTransport({
        label: 'parent-logger',
        batchSize: 1,
        debounceMs: 0,
      });
      const parentLogger = createLogger({
        label: 'parent-logger',
        level: LogLevel.WARN,
        hideMeta: true,
        disabled: false,
        transports: [transport],
      });

      const childLogger = parentLogger.child({
        label: 'child-logger',
      });

      // Child should inherit parent's properties
      expect(childLogger.getLogLevel()).toBe(LogLevel.WARN);
      expect(childLogger.getLogLevelName()).toBe('WARN');
    });

    test('should allow child logger to override parent properties', () => {
      const transport = new ConsoleTransport({
        label: 'parent-logger',
        batchSize: 1,
        debounceMs: 0,
      });
      const parentLogger = createLogger({
        label: 'parent-logger',
        level: LogLevel.WARN,
        hideMeta: true,
        transports: [transport],
      });

      const childLogger = parentLogger.child({
        label: 'child-logger',
        level: LogLevel.DEBUG,
        hideMeta: false,
      });

      // Child should have its own overridden properties
      expect(childLogger.getLogLevel()).toBe(LogLevel.DEBUG);
      expect(childLogger.getLogLevelName()).toBe('DEBUG');
    });

    test('should inherit disabled state from parent', () => {
      const transport = new ConsoleTransport({
        label: 'parent-logger',
        batchSize: 1,
        debounceMs: 0,
      });
      const parentLogger = createLogger({
        label: 'parent-logger',
        disabled: true,
        transports: [transport],
      });

      const childLogger = parentLogger.child({
        label: 'child-logger',
      });

      childLogger.info('This should not be logged');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    test('should allow child logger to enable itself when parent is disabled', () => {
      const transport = new ConsoleTransport({
        batchSize: 1,
        debounceMs: 0,
      });
      const parentLogger = createLogger({
        label: 'parent-logger',
        disabled: true,
        transports: [transport],
      });

      const childLogger = parentLogger.child({
        label: 'child-logger',
        disabled: false,
      });

      childLogger.info('This should be logged');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should inherit transports from parent', () => {
      const customTransport = new ConsoleTransport({
        label: 'custom',
        batchSize: 1,
        debounceMs: 0,
      });
      const parentLogger = createLogger({
        label: 'parent-logger',
        transports: [customTransport],
      });

      const childLogger = parentLogger.child({
        label: 'child-logger',
      });

      childLogger.info('Test message');

      // Should use the same transport as parent
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should allow child logger to use different transports', () => {
      const parentTransport = new ConsoleTransport({
        label: 'parent',
        batchSize: 1,
        debounceMs: 0,
      });
      const childTransport = new ConsoleTransport({
        label: 'child',
        batchSize: 1,
        debounceMs: 0,
      });

      const parentLogger = createLogger({
        label: 'parent-logger',
        transports: [parentTransport],
      });

      const childLogger = parentLogger.child({
        label: 'child-logger',
        transports: [childTransport],
      });

      childLogger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should maintain independence between parent and child log levels', () => {
      const parentTransport = new ConsoleTransport({
        label: 'parent-logger',
        batchSize: 1,
        debounceMs: 0,
      });
      const childTransport = new ConsoleTransport({
        label: 'child-logger',
        batchSize: 1,
        debounceMs: 0,
      });

      const parentLogger = createLogger({
        label: 'parent-logger',
        level: LogLevel.INFO,
        transports: [parentTransport],
      });

      const childLogger = parentLogger.child({
        label: 'child-logger',
        level: LogLevel.ERROR,
        transports: [childTransport],
      });

      // Change parent log level
      parentLogger.setLogLevel(LogLevel.DEBUG);

      // Child should still have its own level
      expect(parentLogger.getLogLevel()).toBe(LogLevel.DEBUG);
      expect(childLogger.getLogLevel()).toBe(LogLevel.ERROR);

      // Change child log level
      childLogger.setLogLevel(LogLevel.WARN);

      // Parent should not be affected
      expect(parentLogger.getLogLevel()).toBe(LogLevel.DEBUG);
      expect(childLogger.getLogLevel()).toBe(LogLevel.WARN);
    });

    test('should create nested child loggers', () => {
      const grandparentTransport = new ConsoleTransport({
        label: 'grandparent-logger',
        level: LogLevel.DEBUG, // Set appropriate level
        batchSize: 1,
        debounceMs: 0,
      });
      const parentTransport = new ConsoleTransport({
        label: 'parent-logger',
        level: LogLevel.DEBUG, // Set appropriate level
        batchSize: 1,
        debounceMs: 0,
      });
      const childTransport = new ConsoleTransport({
        label: 'child-logger',
        level: LogLevel.DEBUG, // Set appropriate level
        batchSize: 1,
        debounceMs: 0,
      });

      const grandparentLogger = createLogger({
        label: 'grandparent-logger',
        level: LogLevel.INFO,
        hideMeta: true,
        transports: [grandparentTransport],
      });

      const parentLogger = grandparentLogger.child({
        label: 'parent-logger',
        level: LogLevel.WARN,
        transports: [parentTransport],
      });

      const childLogger = parentLogger.child({
        label: 'child-logger',
        level: LogLevel.DEBUG,
        transports: [childTransport],
      });

      // Each logger should have its own properties
      expect(grandparentLogger.getLogLevel()).toBe(LogLevel.INFO);
      expect(parentLogger.getLogLevel()).toBe(LogLevel.WARN);
      expect(childLogger.getLogLevel()).toBe(LogLevel.DEBUG);

      // Test that they can log independently
      grandparentLogger.info('Grandparent message');
      parentLogger.warn('Parent message');
      childLogger.debug('Child message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // grandparent info and child debug
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1); // parent warn
    });

    test('should properly inherit and override hideMeta setting', () => {
      const parentTransport = new ConsoleTransport({
        label: 'parent-logger',
        hideMeta: true,
        batchSize: 1,
        debounceMs: 0,
      });
      const child2Transport = new ConsoleTransport({
        label: 'child2-logger',
        hideMeta: false,
        batchSize: 1,
        debounceMs: 0,
      });

      const parentLogger = createLogger({
        label: 'parent-logger',
        hideMeta: true,
        transports: [parentTransport],
      });

      // Child inherits hideMeta
      const child1 = parentLogger.child({
        label: 'child1-logger',
      });

      // Child overrides hideMeta
      const child2 = parentLogger.child({
        label: 'child2-logger',
        hideMeta: false,
        transports: [child2Transport],
      });

      const metadata: LogMeta = {test: 'data'};

      child1.info('Child1 message', metadata);
      child2.info('Child2 message', metadata);

      // Check that child1 hides metadata while child2 shows it
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Child1 message'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Child2 message'), metadata);
    });
  });

  describe('error handling', () => {
    test('should handle undefined and null parameters gracefully', () => {
      const transport = new ConsoleTransport({
        label: 'test-logger',
        batchSize: 1,
        debounceMs: 0,
      });
      const logger = createLogger({
        label: 'test-logger',
        transports: [transport],
      });

      expect(() => {
        logger.info('Message with undefined', undefined);
        logger.info('Message with null', null);
      }).not.toThrow();

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    test('should handle empty messages', () => {
      const transport = new ConsoleTransport({
        label: 'test-logger',
        batchSize: 1,
        debounceMs: 0,
      });
      const logger = createLogger({
        label: 'test-logger',
        transports: [transport],
      });

      expect(() => {
        logger.info('');
      }).not.toThrow();

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });
});

describe('sanitizeLogMeta', () => {
  test('should preserve valid string values', () => {
    const input = {
      message: 'hello world',
      empty: '',
      withSpecialChars: 'test@#$%^&*()',
    };

    const result = sanitizeLogMeta(input);

    expect(result).toEqual({
      message: 'hello world',
      empty: '',
      withSpecialChars: 'test@#$%^&*()',
    });
  });

  test('should preserve valid number values', () => {
    const input = {
      integer: 42,
      float: Math.PI,
      zero: 0,
      negative: -123,
      infinity: Infinity,
      negativeInfinity: -Infinity,
      notANumber: NaN,
    };

    const result = sanitizeLogMeta(input);

    expect(result).toEqual({
      integer: 42,
      float: Math.PI,
      zero: 0,
      negative: -123,
      infinity: Infinity,
      negativeInfinity: -Infinity,
      notANumber: NaN,
    });
  });

  test('should preserve valid boolean values', () => {
    const input = {
      isTrue: true,
      isFalse: false,
    };

    const result = sanitizeLogMeta(input);

    expect(result).toEqual({
      isTrue: true,
      isFalse: false,
    });
  });

  test('should preserve null and undefined values', () => {
    const input = {
      nullValue: null,
      undefinedValue: undefined,
    };

    const result = sanitizeLogMeta(input);

    expect(result).toEqual({
      nullValue: null,
      undefinedValue: undefined,
    });
  });

  test('should convert objects to JSON strings', () => {
    const input = {
      simpleObject: {name: 'John', age: 30},
      nestedObject: {
        user: {id: 1, profile: {email: 'test@example.com'}},
        settings: {theme: 'dark', notifications: true},
      },
      emptyObject: {},
    };

    const result = sanitizeLogMeta(input);

    expect(result).toEqual({
      simpleObject: '{"name":"John","age":30}',
      nestedObject:
        '{"user":{"id":1,"profile":{"email":"test@example.com"}},"settings":{"theme":"dark","notifications":true}}',
      emptyObject: '{}',
    });
  });

  test('should convert arrays to JSON strings', () => {
    const input = {
      numberArray: [1, 2, 3, 4, 5],
      stringArray: ['apple', 'banana', 'cherry'],
      mixedArray: [1, 'two', true, null, {key: 'value'}],
      emptyArray: [],
      nestedArray: [
        [1, 2],
        [3, 4],
      ],
    };

    const result = sanitizeLogMeta(input);

    expect(result).toEqual({
      numberArray: '[1,2,3,4,5]',
      stringArray: '["apple","banana","cherry"]',
      mixedArray: '[1,"two",true,null,{"key":"value"}]',
      emptyArray: '[]',
      nestedArray: '[[1,2],[3,4]]',
    });
  });

  test('should convert functions to strings', () => {
    const input = {
      regularFunction: () => 'test',
      demo() {
        return 'demo';
      },
    };

    const result = sanitizeLogMeta(input);

    // Functions should be converted to string representation
    expect(result).toEqual({
      regularFunction: '() => "test"',
      demo: 'demo() {\n        return "demo";\n      }',
    });
  });

  test('should convert Date objects to JSON strings', () => {
    const testDate = new Date('2023-01-01T12:00:00.000Z');
    const input = {
      date: testDate,
      invalidDate: new Date('invalid'),
    };

    const result = sanitizeLogMeta(input);

    expect(result).toEqual({
      date: '"2023-01-01T12:00:00.000Z"',
      // Invalid Date gets converted to null by JSON.stringify, then to "null" string
      invalidDate: 'null',
    });
  });

  test('should convert Symbols to string representation', () => {
    const input = {
      symbol: Symbol('test'),
      symbolWithDescription: Symbol.for('global'),
    };

    const result = sanitizeLogMeta(input);

    expect(result).toEqual({
      symbol: 'Symbol(test)',
      symbolWithDescription: 'Symbol(global)',
    });
  });

  test('should handle mixed data types in one object', () => {
    const input = {
      string: 'hello',
      number: -42.13,
      boolean: true,
      nullValue: null,
      undefinedValue: undefined,
      object: {nested: 'value'},
      array: [1, 2, 3],
      func: () => 'test',
      date: new Date('2023-01-01'),
      symbol: Symbol('mixed'),
    };

    const result = sanitizeLogMeta(input);

    expect(result).toEqual({
      string: 'hello',
      number: -42.13,
      boolean: true,
      nullValue: null,
      undefinedValue: undefined,
      object: '{"nested":"value"}',
      array: '[1,2,3]',
      func: '() => "test"',
      date: '"2023-01-01T00:00:00.000Z"',
      symbol: 'Symbol(mixed)',
    });
  });

  test('should handle circular references gracefully', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Needed for testing circular reference behavior
    const circularObj: any = {name: 'test'};
    circularObj.self = circularObj;

    const input = {
      circular: circularObj,
    };

    const result = sanitizeLogMeta(input);

    expect(result).toEqual({
      circular: '[object Object]',
    });
  });

  test('should handle empty input object', () => {
    const input = {};

    const result = sanitizeLogMeta(input);

    expect(result).toEqual({});
  });

  test('should handle objects with special property names', () => {
    const input = {
      'property-with-dashes': 'value1',
      'property with spaces': 'value2',
      '123numericStart': 'value3',
      '': 'empty key',
    };

    const result = sanitizeLogMeta(input);

    expect(result).toEqual({
      'property-with-dashes': 'value1',
      'property with spaces': 'value2',
      '123numericStart': 'value3',
      '': 'empty key',
    });
  });
});

describe('Default Metadata', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  const transport = new ConsoleTransport({
    label: 'test-logger',
    batchSize: 1,
    debounceMs: 0,
  });

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('should merge defaultMeta with log metadata', () => {
    const logger = createLogger({
      label: 'test-logger',
      defaultMeta: {
        service: 'my-service',
        version: '1.0.0',
      },
      transports: [transport],
    });

    logger.info('User logged in', {
      userId: 123,
      action: 'login',
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('User logged in'), {
      service: 'my-service',
      version: '1.0.0',
      userId: 123,
      action: 'login',
    });
  });

  test('should use only defaultMeta when no log metadata provided', () => {
    const defaultMeta: LogMeta = {
      service: 'my-service',
      version: '1.0.0',
    };

    const logger = createLogger({
      label: 'test-logger',
      defaultMeta,
      transports: [transport],
    });

    logger.info('Simple message');

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Simple message'), defaultMeta);
  });

  test('should override defaultMeta with log metadata for same keys', () => {
    const logger = createLogger({
      label: 'test-logger',
      defaultMeta: {
        service: 'my-service',
        version: '1.0.0',
        environment: 'development',
      },
      transports: [transport],
    });

    logger.info('Environment override', {
      environment: 'production', // Override default
      userId: 123,
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Environment override'), {
      service: 'my-service',
      version: '1.0.0',
      environment: 'production',
      userId: 123,
    });
  });

  test('should work without defaultMeta', () => {
    const logger = createLogger({
      label: 'test-logger',
      transports: [transport],
    });

    const logMeta: LogMeta = {
      userId: 123,
    };

    logger.info('No default meta', logMeta);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No default meta'), logMeta);
  });

  test('should sanitize defaultMeta on logger creation', () => {
    const transport = new ConsoleTransport({
      label: 'test-logger',
      batchSize: 1,
      debounceMs: 0,
    });

    // biome-ignore lint/suspicious/noExplicitAny: Testing unsupported types
    const unsanitizedDefaultMeta: Record<string, any> = {
      service: 'my-service',
      func: () => 'test', // Function should be converted to string
      obj: {nested: 'value'}, // Object should be JSON stringified
    };

    const logger = createLogger({
      label: 'test-logger',
      defaultMeta: unsanitizedDefaultMeta,
      transports: [transport],
    });

    logger.info('Sanitization test');

    const expectedMeta = {
      service: 'my-service',
      func: '() => "test"',
      obj: '{"nested":"value"}',
    };

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Sanitization test'), expectedMeta);
  });

  test('should inherit defaultMeta from parent logger', () => {
    const parentLogger = createLogger({
      label: 'parent-logger',
      defaultMeta: {
        service: 'my-service',
        version: '1.0.0',
      },
      transports: [transport],
    });

    const childLogger = parentLogger.child({
      label: 'child-logger',
    });

    childLogger.info('Child log message', {userId: 123});

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Child log message'), {
      service: 'my-service',
      version: '1.0.0',
      userId: 123,
    });
  });

  test('should override parent defaultMeta when child has own defaultMeta', () => {
    const parentLogger = createLogger({
      label: 'parent-logger',
      defaultMeta: {
        service: 'parent-service',
        version: '1.0.0',
      },
      transports: [transport],
    });

    const childLogger = parentLogger.child({
      label: 'child-logger',
      defaultMeta: {
        service: 'child-service',
        component: 'auth',
      },
    });

    childLogger.info('Child with own meta', {userId: 123});

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Child with own meta'), {
      service: 'child-service', // Child's defaultMeta takes precedence
      component: 'auth',
      userId: 123,
    });
  });

  test('should work with nested child loggers', () => {
    const rootLogger = createLogger({
      label: 'root-logger',
      defaultMeta: {
        service: 'my-service',
        version: '1.0.0',
      },
      transports: [transport],
    });

    const childLogger = rootLogger.child({
      label: 'child-logger',
    });

    const grandchildLogger = childLogger.child({
      label: 'grandchild-logger',
      defaultMeta: {
        component: 'auth',
      },
    });

    grandchildLogger.info('Nested child message');

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nested child message'), {
      component: 'auth', // Only grandchild's defaultMeta since it overrides
    });
  });
});
