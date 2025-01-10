import {
  createLogger,
  isValidLogLevel,
  LogLevels,
  shouldPublishLog,
  type LogLevel,
} from './logger';

describe('shouldPublishLog', () => {
  const testCases: {
    currentLogLevel: LogLevel;
    logLevel: LogLevel;
    expected: boolean;
  }[] = [
    { currentLogLevel: 'info', logLevel: 'info', expected: true },
    { currentLogLevel: 'info', logLevel: 'warn', expected: false },
    { currentLogLevel: 'info', logLevel: 'error', expected: false },
    { currentLogLevel: 'info', logLevel: 'debug', expected: false },
    { currentLogLevel: 'warn', logLevel: 'info', expected: true },
    { currentLogLevel: 'warn', logLevel: 'warn', expected: true },
    { currentLogLevel: 'warn', logLevel: 'error', expected: false },
    { currentLogLevel: 'warn', logLevel: 'debug', expected: false },
    { currentLogLevel: 'error', logLevel: 'info', expected: true },
    { currentLogLevel: 'error', logLevel: 'warn', expected: true },
    { currentLogLevel: 'error', logLevel: 'error', expected: true },
    { currentLogLevel: 'error', logLevel: 'debug', expected: false },
    { currentLogLevel: 'debug', logLevel: 'info', expected: true },
    { currentLogLevel: 'debug', logLevel: 'warn', expected: true },
    { currentLogLevel: 'debug', logLevel: 'error', expected: true },
    { currentLogLevel: 'debug', logLevel: 'debug', expected: true },
  ];

  testCases.forEach(({ currentLogLevel, logLevel, expected }) => {
    it(`should return "${expected}" when currentLogLevel is "${currentLogLevel}" and logLevel is "${logLevel}"`, () => {
      expect(shouldPublishLog(currentLogLevel, logLevel)).toBe(expected);
    });
  });
});

describe('isValidLogLevel', () => {
  it('should accept log-levels', () => {
    LogLevels.forEach((level) => {
      expect(isValidLogLevel(level)).toBeTruthy();
    });
  });

  it('should accept log-levels in upper-case', () => {
    LogLevels.map((lvl) => lvl.toUpperCase()).forEach((level) => {
      expect(isValidLogLevel(level)).toBeTruthy();
    });
  });

  it('should reject other values', () => {
    expect(isValidLogLevel('foo')).toBeFalsy();
  });
});

describe('createLogger', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.restoreAllMocks();
  });

  describe('label setting', () => {
    it('should use the provided label', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const logger = createLogger({ label: 'test-label' });

      logger.error('test message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[test-label]:')
        // We don't check the exact format since it includes timestamps
      );
    });

    it('should use default label if none provided', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const logger = createLogger();

      logger.error('test message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[default]:'));
    });
  });

  describe('log levels', () => {
    it('should respect the configured log level', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const logger = createLogger({ level: 'info' });

      logger.error('this should not be logged');

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log messages at or below the configured level', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const consoleLogSpy = vi.spyOn(console, 'log');
      const logger = createLogger({ level: 'warn' });

      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/INFO.*info message/));
      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringMatching(/WARN.*warn message/));
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should use error as default log level if none provided', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const consoleLogStpy = vi.spyOn(console, 'log');
      const logger = createLogger();

      logger.error('error message');
      logger.warn('warn message');
      logger.debug('debug message');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleLogStpy).not.toHaveBeenCalled();
    });
  });

  describe('log output', () => {
    it('should not call logger when disabled', () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      const logger = createLogger({
        disabled: true,
        level: 'debug',
      });

      logger.info('test message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log with the correct level-specific console methods', () => {
      const consoleLogSpy = vi.spyOn(console, 'log');

      const logger = createLogger({ level: 'debug' });

      logger.info('info message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/INFO.*info message/));
    });

    it('should include additional arguments in the log output', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const logger = createLogger();
      const additionalArg = { detail: 'extra info' };

      logger.error('error message', additionalArg);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR.*error message/),
        additionalArg
      );
    });
  });

  describe('custom logger', () => {
    it('should use custom log function when provided', () => {
      const customLog = vi.fn();
      const logger = createLogger({
        log: customLog,
        level: 'debug',
      });

      logger.info('test message', { extra: 'data' });

      expect(customLog).toHaveBeenCalledWith('info', 'test message', { extra: 'data' });
    });

    it('should respect log levels with custom logger', () => {
      const customLog = vi.fn();
      const logger = createLogger({
        log: customLog,
        level: 'warn',
      });

      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');

      expect(customLog).not.toHaveBeenCalledWith('error', 'error message');
      expect(customLog).toHaveBeenCalledWith('warn', 'warn message');
      expect(customLog).toHaveBeenCalledWith('info', 'info message');
    });

    it('should not call custom logger when disabled', () => {
      const customLog = vi.fn();
      const logger = createLogger({
        log: customLog,
        disabled: true,
        level: 'debug',
      });

      logger.info('test message');

      expect(customLog).not.toHaveBeenCalled();
    });
  });
});
