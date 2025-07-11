import {LogLevel} from '@tklein1801/logger.js';
import {getLogLevel} from './getLogLevel';

describe('getLogLevel', () => {
  it('should return the log level from the environment variable', () => {
    process.env.LOG_LEVEL = 'DEBUG';
    expect(getLogLevel()).toBe(LogLevel.DEBUG);
  });

  it('should return the log level from the environment variable (not case sensitive)', () => {
    process.env.LOG_LEVEL = 'DeBuG';
    expect(getLogLevel()).toBe(LogLevel.DEBUG);
  });

  it("should default to 'error' if the environment variable is not set", () => {
    delete process.env.LOG_LEVEL;
    expect(getLogLevel()).toBe(LogLevel.ERROR);
  });

  it("should default to 'error' if the environment variable is invalid", () => {
    process.env.LOG_LEVEL = 'foo';
    expect(getLogLevel()).toBe(LogLevel.ERROR);
  });
});
