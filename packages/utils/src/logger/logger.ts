import { LOG_COLORS, LOG_LEVEL_COLORS } from './config';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const LogLevels = ['info', 'warn', 'error', 'debug'] as const;

export function shouldPublishLog(currentLogLevel: LogLevel, logLevel: LogLevel): boolean {
  return LogLevels.indexOf(logLevel) <= LogLevels.indexOf(currentLogLevel);
}

export function isValidLogLevel(level: string): level is LogLevel {
  return LogLevels.includes(level.toLowerCase() as LogLevel);
}

export interface Logger {
  label?: string;
  disabled?: boolean;
  level?: LogLevel;
  log?: (level: LogLevel, message: string, ...args: any[]) => void;
}

export type LogHandlerParams = Parameters<NonNullable<Logger['log']>> extends [
  LogLevel,
  ...infer Rest
]
  ? Rest
  : never;

const formatMessage = (level: LogLevel, message: string, label: string): string => {
  const timestamp = new Date().toISOString();
  return `${LOG_COLORS.dim}${timestamp}${LOG_COLORS.reset} ${
    LOG_LEVEL_COLORS[level]
  }${level.toUpperCase()}${LOG_COLORS.reset} ${LOG_COLORS.bright}[${label}]:${
    LOG_COLORS.reset
  } ${message}`;
};

export type LoggerClient = Record<LogLevel, (...params: LogHandlerParams) => void>;

export function createLogger(options?: Logger): LoggerClient {
  const enabled = options?.disabled !== true;
  const logLevel = options?.level && isValidLogLevel(options.level) ? options.level : 'error';
  const label = options?.label ?? 'default';

  const LogFunc = (level: LogLevel, message: string, args: any[] = []): void => {
    if (!enabled || !shouldPublishLog(logLevel, level)) {
      return;
    }

    const formattedMessage = formatMessage(level, message, label);

    if (!options || typeof options.log !== 'function') {
      if (level === 'error') {
        console.error(formattedMessage, ...args);
      } else if (level === 'warn') {
        console.warn(formattedMessage, ...args);
      } else {
        console.log(formattedMessage, ...args);
      }
      return;
    }

    options.log(level, message, ...args);
  };

  return {
    ...(Object.fromEntries(
      LogLevels.map((level) => [
        level,
        (...[message, ...args]: LogHandlerParams) => LogFunc(level, message, args),
      ])
    ) as Record<LogLevel, (...params: LogHandlerParams) => void>),
    // childLogger: (childLoggerLabel: string) =>
    //   createLogger({ ...options, label: `${label}:${childLoggerLabel}`, level: logLevel }),
  };
}
