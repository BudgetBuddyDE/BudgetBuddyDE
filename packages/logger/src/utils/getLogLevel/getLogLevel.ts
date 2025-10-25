import {LogLevel} from '../../logger';

/**
 * Parses a log level string into a LogLevel enum.
 * @param level - The log level as a string.
 * @throws Will throw an error if the log level is unknown.
 * @returns The corresponding LogLevel enum value.
 */
export function getLogLevel(level: string): LogLevel {
  switch (level.toLowerCase()) {
    case 'fatal':
      return LogLevel.FATAL;
    case 'error':
      return LogLevel.ERROR;
    case 'warn':
      return LogLevel.WARN;
    case 'info':
      return LogLevel.INFO;
    case 'debug':
      return LogLevel.DEBUG;
    case 'silent':
      return LogLevel.SILENT;
    default:
      throw new Error(`Unknown log level: ${level}`);
  }
}
