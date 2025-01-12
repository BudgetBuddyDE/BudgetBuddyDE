import 'dotenv/config';
import {isValidLogLevel, type LogLevel} from '../logger';

/**
 * Retrieves the log level from the environment variable `LOG_LEVEL`.
 * If the environment variable is not set or contains an invalid log level,
 * it defaults to 'error'.
 *
 * @returns {LogLevel} The log level to be used by the application.
 */
export function getLogLevel(): LogLevel {
  const envVal = process.env.LOG_LEVEL;
  return envVal && isValidLogLevel(envVal) ? envVal : 'error';
}
