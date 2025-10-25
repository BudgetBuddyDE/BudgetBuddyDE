import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {createLogger, LogLevel, type LogMeta} from '../../logger';
import {ConsoleTransport, type ConsoleTransportOptions} from './consoleTransport';

describe('ConsoleTransport', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Use fake timers for debouncing tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    test('should initialize with default options', () => {
      const options: ConsoleTransportOptions = {
        label: 'test-logger',
      };

      const transport = new ConsoleTransport(options);

      expect(transport).toBeInstanceOf(ConsoleTransport);
    });

    test('should initialize with custom options', () => {
      const options: ConsoleTransportOptions = {
        label: 'test-logger',
        hideMeta: true,
        batchSize: 5,
        debounceMs: 500,
        level: LogLevel.WARN,
        enabled: false,
      };

      const transport = new ConsoleTransport(options);

      expect(transport).toBeInstanceOf(ConsoleTransport);
    });

    test('should initialize with custom format function', () => {
      const customFormat = vi.fn(
        (_dateTime: Date, _level: LogLevel, label: string, message: string, _meta?: LogMeta) => {
          return `[CUSTOM] ${label}: ${message}`;
        },
      );

      const options: ConsoleTransportOptions = {
        label: 'test-logger',
        format: customFormat,
      };

      const transport = new ConsoleTransport(options);

      expect(transport).toBeInstanceOf(ConsoleTransport);
    });
  });

  describe('integration with logger', () => {
    test('should output logs through console transport using actual logger', () => {
      const transport = new ConsoleTransport({
        label: 'integration-test',
        batchSize: 1, // Immediate batch processing
        debounceMs: 0, // No debouncing
      });

      const logger = createLogger({
        label: 'integration-test',
        transports: [transport],
      });

      // Log different levels
      logger.info('This is an info message');
      logger.warn('This is a warning message');
      logger.error('This is an error message');

      // Fast-forward timers to trigger any debounced calls
      vi.runAllTimers();

      // Verify console methods were called
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('This is an info message'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('This is a warning message'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('This is an error message'));
    });

    test('should handle metadata correctly', () => {
      const transport = new ConsoleTransport({
        label: 'meta-test',
        batchSize: 1,
        debounceMs: 0,
        hideMeta: false,
      });

      const logger = createLogger({
        label: 'meta-test',
        transports: [transport],
      });

      const metadata = {userId: 123, action: 'login'};
      logger.info('User logged in', metadata);

      vi.runAllTimers();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('User logged in'), metadata);
    });

    test('should hide metadata when hideMeta is true', () => {
      const transport = new ConsoleTransport({
        label: 'hide-meta-test',
        batchSize: 1,
        debounceMs: 0,
        hideMeta: true,
      });

      const logger = createLogger({
        label: 'hide-meta-test',
        transports: [transport],
      });

      const metadata = {userId: 123, action: 'login'};
      logger.info('User logged in', metadata);

      vi.runAllTimers();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('User logged in'));
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.anything(), metadata);
    });

    test('should respect log level filtering', () => {
      const transport = new ConsoleTransport({
        label: 'level-test',
        level: LogLevel.WARN, // Only WARN and above
        batchSize: 1,
        debounceMs: 0,
      });

      const logger = createLogger({
        label: 'level-test',
        transports: [transport],
      });

      logger.debug('Debug message'); // Should be filtered out
      logger.info('Info message'); // Should be filtered out
      logger.warn('Warning message'); // Should be logged
      logger.error('Error message'); // Should be logged

      vi.runAllTimers();

      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Debug message'));
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Info message'));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error message'));
    });

    test('should format log messages correctly with default formatter', () => {
      const transport = new ConsoleTransport({
        label: 'format-test',
        batchSize: 1,
        debounceMs: 0,
      });

      const logger = createLogger({
        label: 'format-test',
        transports: [transport],
      });

      logger.info('Test message');

      vi.runAllTimers();

      const logCall = consoleLogSpy.mock.calls[0];
      const logMessage = logCall[0] as string;

      // Verify the message contains expected components
      expect(logMessage).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/); // ISO timestamp
      expect(logMessage).toContain('INFO');
      expect(logMessage).toContain('[format-test]');
      expect(logMessage).toContain('Test message');
    });
  });

  describe('custom formatting', () => {
    test('should use custom format function when provided', () => {
      const customFormat = vi.fn(
        (_dateTime: Date, level: LogLevel, label: string, message: string, _meta?: LogMeta) => {
          return `[CUSTOM-${LogLevel[level]}] ${label}: ${message}`;
        },
      );

      const transport = new ConsoleTransport({
        label: 'custom-format-test',
        format: customFormat,
        batchSize: 1,
        debounceMs: 0,
      });

      const logger = createLogger({
        label: 'custom-format-test',
        transports: [transport],
      });

      logger.info('Custom formatted message');

      vi.runAllTimers();

      // Verify custom format function was called
      expect(customFormat).toHaveBeenCalledWith(
        expect.any(Date),
        LogLevel.INFO,
        'custom-format-test',
        'Custom formatted message',
        undefined,
      );

      // Verify console was called with custom formatted message
      expect(consoleLogSpy).toHaveBeenCalledWith('[CUSTOM-INFO] custom-format-test: Custom formatted message');
    });

    test('should pass metadata to custom format function', () => {
      const customFormat = vi.fn(
        (_dateTime: Date, _level: LogLevel, _label: string, message: string, meta?: LogMeta) => {
          const metaString = meta ? ` [Meta: ${JSON.stringify(meta)}]` : '';
          return `[CUSTOM] ${message}${metaString}`;
        },
      );

      const transport = new ConsoleTransport({
        label: 'custom-format-meta-test',
        format: customFormat,
        batchSize: 1,
        debounceMs: 0,
      });

      const logger = createLogger({
        label: 'custom-format-meta-test',
        transports: [transport],
      });

      const metadata = {requestId: 'abc123'};
      logger.warn('Request failed', metadata);

      vi.runAllTimers();

      // Verify custom format function was called with metadata
      expect(customFormat).toHaveBeenCalledWith(
        expect.any(Date),
        LogLevel.WARN,
        'custom-format-meta-test',
        'Request failed',
        metadata,
      );

      // Verify console was called with custom formatted message including metadata
      expect(consoleWarnSpy).toHaveBeenCalledWith('[CUSTOM] Request failed [Meta: {"requestId":"abc123"}]', metadata);
    });

    test('should handle custom format function with different log levels', () => {
      const customFormat = vi.fn(
        (_dateTime: Date, level: LogLevel, _label: string, message: string, _meta?: LogMeta) => {
          const levelName = LogLevel[level];
          return `🚀 [${levelName}] ${message}`;
        },
      );

      const transport = new ConsoleTransport({
        label: 'emoji-test',
        format: customFormat,
        batchSize: 1,
        debounceMs: 0,
        level: LogLevel.DEBUG, // Set to DEBUG to allow all log levels
      });

      const logger = createLogger({
        label: 'emoji-test',
        level: LogLevel.DEBUG, // Set logger level to DEBUG as well
        transports: [transport],
      });

      logger.debug('Debug with emoji');
      logger.info('Info with emoji');
      logger.warn('Warning with emoji');
      logger.error('Error with emoji');

      vi.runAllTimers();

      // Verify custom format was called for each level
      expect(customFormat).toHaveBeenCalledTimes(4);
      expect(customFormat).toHaveBeenNthCalledWith(
        1,
        expect.any(Date),
        LogLevel.DEBUG,
        'emoji-test',
        'Debug with emoji',
        undefined,
      );
      expect(customFormat).toHaveBeenNthCalledWith(
        2,
        expect.any(Date),
        LogLevel.INFO,
        'emoji-test',
        'Info with emoji',
        undefined,
      );
      expect(customFormat).toHaveBeenNthCalledWith(
        3,
        expect.any(Date),
        LogLevel.WARN,
        'emoji-test',
        'Warning with emoji',
        undefined,
      );
      expect(customFormat).toHaveBeenNthCalledWith(
        4,
        expect.any(Date),
        LogLevel.ERROR,
        'emoji-test',
        'Error with emoji',
        undefined,
      );

      // Verify console methods were called with custom formatted messages
      expect(consoleLogSpy).toHaveBeenCalledWith('🚀 [DEBUG] Debug with emoji');
      expect(consoleLogSpy).toHaveBeenCalledWith('🚀 [INFO] Info with emoji');
      expect(consoleWarnSpy).toHaveBeenCalledWith('🚀 [WARN] Warning with emoji');
      expect(consoleErrorSpy).toHaveBeenCalledWith('🚀 [ERROR] Error with emoji');
    });
  });

  describe('batching and debouncing', () => {
    test('should batch multiple log entries', () => {
      const transport = new ConsoleTransport({
        label: 'batch-test',
        batchSize: 3,
        debounceMs: 100,
      });

      const logger = createLogger({
        label: 'batch-test',
        transports: [transport],
      });

      // Log 3 messages quickly
      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');

      // The batch size is reached, so messages should be sent immediately
      // But with debouncing they might be delayed
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('Message 1'));
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, expect.stringContaining('Message 2'));
      expect(consoleLogSpy).toHaveBeenNthCalledWith(3, expect.stringContaining('Message 3'));
    });

    test('should handle debouncing correctly', () => {
      const transport = new ConsoleTransport({
        label: 'debounce-test',
        batchSize: 10, // Large batch size so debouncing controls when logs are sent
        debounceMs: 50,
      });

      const logger = createLogger({
        label: 'debounce-test',
        transports: [transport],
      });

      logger.info('Debounced message 1');
      logger.info('Debounced message 2');

      // Should not have logged yet due to debouncing
      expect(consoleLogSpy).not.toHaveBeenCalled();

      // Fast-forward past debounce time
      vi.advanceTimersByTime(60);

      // Now messages should be logged
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('Debounced message 1'));
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, expect.stringContaining('Debounced message 2'));
    });

    test('should handle immediate batch when batch size is reached', () => {
      const transport = new ConsoleTransport({
        label: 'immediate-batch-test',
        batchSize: 2,
        debounceMs: 1000, // Long debounce, but should be triggered by batch size
      });

      const logger = createLogger({
        label: 'immediate-batch-test',
        transports: [transport],
      });

      logger.info('Message 1');
      logger.info('Message 2'); // This should trigger immediate batch

      // Should have logged immediately when batch size was reached
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('Message 1'));
      expect(consoleLogSpy).toHaveBeenNthCalledWith(2, expect.stringContaining('Message 2'));
    });
  });

  describe('disabled transport', () => {
    test('should not log when transport is disabled', () => {
      const transport = new ConsoleTransport({
        label: 'disabled-test',
        enabled: false,
        batchSize: 1,
        debounceMs: 0,
      });

      const logger = createLogger({
        label: 'disabled-test',
        transports: [transport],
      });

      logger.info('This should not be logged');
      logger.error('This should also not be logged');

      vi.runAllTimers();

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('should handle empty message', () => {
      const transport = new ConsoleTransport({
        label: 'empty-message-test',
        batchSize: 1,
        debounceMs: 0,
      });

      const logger = createLogger({
        label: 'empty-message-test',
        transports: [transport],
      });

      logger.info('');

      vi.runAllTimers();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[empty-message-test]'));
    });

    test('should handle message with parameters', () => {
      const transport = new ConsoleTransport({
        label: 'params-test',
        batchSize: 1,
        debounceMs: 0,
      });

      const logger = createLogger({
        label: 'params-test',
        transports: [transport],
      });

      logger.info('User %s has %d points', 'John', 42);

      vi.runAllTimers();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('User John has 42 points'));
    });

    test('should handle FATAL log level correctly', () => {
      const transport = new ConsoleTransport({
        label: 'fatal-test',
        batchSize: 1,
        debounceMs: 0,
      });

      const logger = createLogger({
        label: 'fatal-test',
        transports: [transport],
      });

      logger.fatal('Fatal error occurred');

      vi.runAllTimers();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Fatal error occurred'));
    });

    test('should handle complex metadata objects', () => {
      const transport = new ConsoleTransport({
        label: 'complex-meta-test',
        batchSize: 1,
        debounceMs: 0,
        hideMeta: false,
      });

      const logger = createLogger({
        label: 'complex-meta-test',
        transports: [transport],
      });

      const complexMeta = {
        user: {
          id: 123,
          name: 'John Doe',
          roles: ['admin', 'user'],
        },
        request: {
          method: 'POST',
          url: '/api/users',
          headers: {
            'content-type': 'application/json',
          },
        },
        timestamp: new Date('2023-01-01T00:00:00.000Z'),
      };

      logger.info('Complex operation completed', complexMeta);

      vi.runAllTimers();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Complex operation completed'), {
        request: '{"method":"POST","url":"/api/users","headers":{"content-type":"application/json"}}',
        timestamp: '"2023-01-01T00:00:00.000Z"',
        user: '{"id":123,"name":"John Doe","roles":["admin","user"]}',
      });
    });

    test('should handle custom format function that returns empty string', () => {
      const customFormat = vi.fn(() => '');

      const transport = new ConsoleTransport({
        label: 'empty-format-test',
        format: customFormat,
        batchSize: 1,
        debounceMs: 0,
      });

      const logger = createLogger({
        label: 'empty-format-test',
        transports: [transport],
      });

      logger.info('This message will be formatted as empty');

      vi.runAllTimers();

      expect(customFormat).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });

    test('should handle custom format function that throws error', () => {
      const customFormat = vi.fn(() => {
        throw new Error('Format function error');
      });

      const transport = new ConsoleTransport({
        label: 'error-format-test',
        format: customFormat,
        batchSize: 1,
        debounceMs: 0,
      });

      const logger = createLogger({
        label: 'error-format-test',
        transports: [transport],
      });

      // This should not crash the application
      logger.info('This will cause format error');

      vi.runAllTimers();

      expect(customFormat).toHaveBeenCalled();
      // The error should be handled gracefully, though the exact behavior may vary
    });
  });
});
