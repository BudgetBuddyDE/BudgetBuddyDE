import {LogLevel} from '../../logger';

/**
 * Checks if a string is a valid log level.
 * @param str - The string to check.
 * @returns True if the string is a valid log level, false otherwise.
 */
export function isValidLogLevel(str: string): str is keyof typeof LogLevel {
  return Object.keys(LogLevel)
    .filter(key => Number.isNaN(Number(key)))
    .includes(str.toUpperCase());
}
