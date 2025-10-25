import { LogLevel } from '../../logger';
/**
 * Parses a log level string into a LogLevel enum.
 * @param level - The log level as a string.
 * @throws Will throw an error if the log level is unknown.
 * @returns The corresponding LogLevel enum value.
 */
export declare function getLogLevel(level: string): LogLevel;
