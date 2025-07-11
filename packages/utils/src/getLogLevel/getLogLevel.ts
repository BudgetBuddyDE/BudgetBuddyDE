import 'dotenv/config';
import {LogLevel} from '@tklein1801/logger.js';
import {isLogLevel} from '@tklein1801/logger.js/lib/isLogLevel/isLogLevel';

/**
 * Retrieves the log level from the environment variable `LOG_LEVEL`.
 * If the environment variable is not set or contains an invalid log level,
 * it defaults to 'error'.
 *
 * @returns {LogLevel} The log level to be used by the application.
 */
export function getLogLevel(): LogLevel {
  const envVal = (process.env.LOG_LEVEL || '').toUpperCase();
  return envVal && isLogLevel(envVal) ? LogLevel[envVal] : LogLevel.ERROR;
}
