import { type Transport } from './transport';
export declare enum LogLevel {
    FATAL = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
    SILENT = 5
}
type LogLevelStrings = keyof typeof LogLevel;
export type LogClientOptions = {
    /**
     * The label of the logger, used to identify the source of log messages.
     */
    label: string;
    /**
     * The label for this logger, used to identify the source of log messages.
     * @default false
     */
    disabled?: boolean;
    /**
     * If true, metadata will not be printed in log messages but will still be passed to the log function.
     */
    hideMeta?: boolean;
    /**
     * The log level to use for this logger.
     * @default LogLevel.INFO
     */
    level?: LogLevel;
    /**
     * An array of transports to use for this logger.
     * If no transports are provided, a `ConsoleTransport` will be used by default.
     */
    transports?: Transport[];
    /**
     * Supress the "No transports configured."-warning if no customized transports are configured for the instance.
     * @default false
     */
    supressNoTransportWarning?: boolean;
    /**
     * Default metadata that will be merged with each log entry.
     * These values are inherited by child loggers if no own defaultMeta is set.
     */
    defaultMeta?: LogMeta;
};
export type LogMeta = Record<string, string | number | boolean | null | undefined>;
export type LogFunction = (message: string, ...params: any[]) => void;
export type LogClient = {
    [K in Lowercase<LogLevelStrings>]: LogFunction;
} & {
    setLogLevel: (level: LogLevel) => void;
    getLogLevel: () => LogLevel;
    getLogLevelName: () => LogLevelStrings;
    child: (options: LogClientOptions) => LogClient;
    getTransports: () => Transport[];
};
export declare function createLogger(options: LogClientOptions): LogClient;
/**
 * Formats a log message with the given level, message, and scope.
 * @param dateTime The date and time of the log entry.
 * @param level The log level.
 * @param message The log message.
 * @param label The log label.
 * @returns The formatted log message.
 */
export declare function formatMessage(dateTime: Date, level: LogLevel, message: string, label: string): string;
/**
 * Sanitizes metadata to ensure all values are of allowed types.
 * Converts unsupported types to strings.
 * @param rawMeta The raw metadata object
 * @returns Sanitized metadata with only allowed types
 */
export declare function sanitizeLogMeta(rawMeta: Record<string, any>): LogMeta;
/**
 * Splits the log parameters into a message, parameters, and optional metadata.
 * Automatically sanitizes metadata to ensure only allowed types are included.
 * @param args The arguments passed to the log function.
 * @returns An object containing the split log parameters.
 */
export declare function splitLogParams(args: any[]): {
    msg: string;
    params: any[];
    meta?: LogMeta;
};
/**
 * Prints a log message to the console.
 * @param level The log level of the message.
 * @param formattedMessage The formatted log message.
 * @param meta Optional metadata associated with the log message.
 * @param hideMeta Optional flag to hide metadata in the output.
 */
export declare function printMessage(level: LogLevel, formattedMessage: string, meta?: LogMeta, hideMeta?: boolean): void;
/**
 * Determines whether a log message should be output based on the current logging level.
 *
 * @param {LogLevel} currentLevel - The current minimum log level. Messages below this level will not be logged.
 * @param {LogLevel} logLevel - The log level of the message to evaluate.
 * @returns {boolean} Returns `true` if the message should be logged, or `false` otherwise.
 *
 * If `currentLevel` is `LogLevel.SILENT`, no messages are logged.
 * Otherwise, messages with a level less than or equal to `currentLevel` will be logged.
 *
 * @example
 * shouldPublishLog(LogLevel.INFO, LogLevel.ERROR); // true
 * shouldPublishLog(LogLevel.WARN, LogLevel.INFO);  // false
 * shouldPublishLog(LogLevel.SILENT, LogLevel.DEBUG); // false
 */
export declare function shouldPublishLog(currentLevel: LogLevel, logLevel: LogLevel): boolean;
export {};
