export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export type LogThreshold = LogLevel | 'silent';

export type LogContext = Record<string, unknown>;

export interface LogEvent {
  level: LogLevel;
  message: string;
  error?: Error;
  [key: string]: unknown;
}

export type LogEventWriter = (event: LogEvent) => void;

export interface Logger {
  trace(message: string | Error, ...args: unknown[]): void;
  debug(message: string | Error, ...args: unknown[]): void;
  info(message: string | Error, ...args: unknown[]): void;
  warn(message: string | Error, ...args: unknown[]): void;
  error(message: string | Error, ...args: unknown[]): void;
  child(context: LogContext): Logger;
}

export interface LoggerOptions {
  context?: LogContext;
  threshold?: LogThreshold;
}
