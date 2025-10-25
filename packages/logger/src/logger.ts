import util from 'node:util';
import {LOG_COLORS, LOG_LEVEL_COLORS} from './config';
import {ConsoleTransport, type Transport} from './transport';
import {TransportManager} from './transportManager';

export enum LogLevel {
  FATAL = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  SILENT = 5,
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

// biome-ignore lint/suspicious/noExplicitAny: The log function parameters can be of any type, so we allow any here.
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

interface LogState {
  /**
   * Indicates whether logging is enabled.
   * If false, all log messages will be ignored.
   */
  isEnabled: boolean;
  /**
   * The current log level.
   * Messages below this level will not be logged.
   */
  level: LogLevel;
}

const LEVEL_STRINGS = Object.values(LogLevel)
  .filter(level => typeof level === 'string')
  .map(level => level.toLowerCase()) as Lowercase<LogLevelStrings>[];
const MAX_LEVEL_LENGTH = Math.max(...LEVEL_STRINGS.map(l => l.length));

export function createLogger(options: LogClientOptions): LogClient {
  const state: LogState = {
    isEnabled: options.disabled !== true,
    level: options.level ?? LogLevel.INFO,
  };
  const transportManager = new TransportManager(options.transports || []);
  const defaultMeta = options.defaultMeta ? sanitizeLogMeta(options.defaultMeta) : undefined;

  // Print warning if no transports are configured for this log-client
  if (transportManager.count === 0) {
    if (!options.supressNoTransportWarning) {
      printMessage(
        LogLevel.WARN,
        formatMessage(
          new Date(),
          LogLevel.WARN,
          'No transports configured. Logs will be sent to the console by default.',
          options.label,
        ),
      );
    }

    transportManager.add(
      new ConsoleTransport({
        label: options.label,
        level: state.level,
        hideMeta: options.hideMeta,
        enabled: state.isEnabled,
        batchSize: 1,
        debounceMs: 0,
      }),
    );
  } else {
    // Run option injection using the transport manager for all configured transports
    transportManager.injectOptions({
      enabled: state.isEnabled,
      level: state.level,
      label: options.label,
    });
  }

  function log(level: LogLevel): LogFunction {
    // biome-ignore lint/suspicious/noExplicitAny: We need to allow any type for the log function parameters
    return (message: string, ...args: any[]) => {
      if (!state.isEnabled || !shouldPublishLog(state.level, level)) return;

      // Split params/metadata
      const {msg, params, meta} = splitLogParams([message, ...args]);

      // Merge defaultMeta with log-specific meta
      const mergedMeta = defaultMeta || meta ? {...defaultMeta, ...meta} : undefined;

      // Format message like console.log with util.format
      const formattedText = args.length > 0 ? util.format(msg, ...params) : msg;
      const dateTime = new Date();

      transportManager.addLogToQueue({
        dateTime: dateTime,
        level: level,
        message: formattedText,
        meta: mergedMeta,
      });
    };
  }

  return {
    ...Object.fromEntries(LEVEL_STRINGS.map(level => [level, log(LogLevel[level.toUpperCase() as LogLevelStrings])])),
    setLogLevel(level: LogLevel, updateTransports = false) {
      state.level = level;
      if (updateTransports) {
        transportManager.setLogLevel(level);
      }
    },
    getLogLevel() {
      return state.level;
    },
    getLogLevelName() {
      return LogLevel[state.level] as LogLevelStrings;
    },
    child(childOptions) {
      const childTransports: Transport[] = childOptions.transports || options.transports || [];
      const mergedOptions: LogClientOptions = {
        label: childOptions.label ?? options.label,
        disabled: childOptions.disabled ?? options.disabled,
        hideMeta: childOptions.hideMeta ?? options.hideMeta,
        level: childOptions.level ?? state.level,
        transports: childTransports,
        defaultMeta: childOptions.defaultMeta ?? options.defaultMeta,
        supressNoTransportWarning: childOptions.supressNoTransportWarning ?? options.supressNoTransportWarning,
      };

      for (const transport of childTransports) {
        transport.configure({
          label: mergedOptions.label,
          level: mergedOptions.level,
          enabled: mergedOptions.disabled !== true,
        });
      }

      return createLogger(mergedOptions);
    },
    getTransports() {
      return transportManager.registeredTransports;
    },
  } as LogClient;
}

/**
 * Pads the log level string to a fixed length for consistent formatting.
 * @param level The log level to pad.
 * @returns The padded log level string.
 */
function getPaddedLevel(level: LogLevel) {
  return LogLevel[level].padEnd(MAX_LEVEL_LENGTH, ' ');
}

/**
 * Formats a log message with the given level, message, and scope.
 * @param dateTime The date and time of the log entry.
 * @param level The log level.
 * @param message The log message.
 * @param label The log label.
 * @returns The formatted log message.
 */
export function formatMessage(dateTime: Date, level: LogLevel, message: string, label: string): string {
  const timestamp = dateTime.toISOString();
  const levelString = getPaddedLevel(level);
  return `${LOG_COLORS.dim}${timestamp}${LOG_COLORS.reset} ${LOG_LEVEL_COLORS[level]}${levelString}${LOG_COLORS.reset} ${LOG_COLORS.bright}[${label}]:${LOG_COLORS.reset} ${message}`;
}

/**
 * Sanitizes metadata to ensure all values are of allowed types.
 * Converts unsupported types to strings.
 * @param rawMeta The raw metadata object
 * @returns Sanitized metadata with only allowed types
 */
// biome-ignore lint/suspicious/noExplicitAny: We need to accept any input type to sanitize it
export function sanitizeLogMeta(rawMeta: Record<string, any>): LogMeta {
  const sanitized: LogMeta = {};

  for (const [key, value] of Object.entries(rawMeta)) {
    if (!value) {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
      continue;
    }

    // Convert unsupported types to strings
    if (typeof value === 'function' || typeof value === 'symbol') {
      // JSON.stringify returns undefined for functions and symbols, so use String() directly
      sanitized[key] = String(value);
    } else {
      try {
        sanitized[key] = JSON.stringify(value);
      } catch {
        sanitized[key] = String(value);
      }
    }
  }

  return sanitized;
}

/**
 * Splits the log parameters into a message, parameters, and optional metadata.
 * Automatically sanitizes metadata to ensure only allowed types are included.
 * @param args The arguments passed to the log function.
 * @returns An object containing the split log parameters.
 */
// biome-ignore lint/suspicious/noExplicitAny: The arguments can be of any type, so we allow any here.
export function splitLogParams(args: any[]): {msg: string; params: any[]; meta?: LogMeta} {
  let meta: LogMeta | undefined;
  if (
    args.length > 1 &&
    typeof args[args.length - 1] === 'object' &&
    args[args.length - 1] !== null &&
    !Array.isArray(args[args.length - 1])
  ) {
    const rawMeta = args.pop();
    meta = sanitizeLogMeta(rawMeta);
  }
  const [msg, ...params] = args;
  return {msg, params, meta};
}

/**
 * Prints a log message to the console.
 * @param level The log level of the message.
 * @param formattedMessage The formatted log message.
 * @param meta Optional metadata associated with the log message.
 * @param hideMeta Optional flag to hide metadata in the output.
 */
export function printMessage(level: LogLevel, formattedMessage: string, meta?: LogMeta, hideMeta?: boolean) {
  switch (level) {
    case LogLevel.FATAL:
    case LogLevel.ERROR:
      meta && !hideMeta ? console.error(formattedMessage, meta) : console.error(formattedMessage);
      break;
    case LogLevel.WARN:
      meta && !hideMeta ? console.warn(formattedMessage, meta) : console.warn(formattedMessage);
      break;
    // For readability, we can keep INFO and DEBUG
    // case LogLevel.INFO:
    // case LogLevel.DEBUG:
    default:
      meta && !hideMeta ? console.log(formattedMessage, meta) : console.log(formattedMessage);
  }
}

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
export function shouldPublishLog(currentLevel: LogLevel, logLevel: LogLevel): boolean {
  if (currentLevel === LogLevel.SILENT) return false;
  return logLevel <= currentLevel;
}
