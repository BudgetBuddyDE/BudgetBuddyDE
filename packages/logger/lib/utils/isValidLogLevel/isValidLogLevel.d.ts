import { LogLevel } from '../../logger';
/**
 * Checks if a string is a valid log level.
 * @param str - The string to check.
 * @returns True if the string is a valid log level, false otherwise.
 */
export declare function isValidLogLevel(str: string): str is keyof typeof LogLevel;
