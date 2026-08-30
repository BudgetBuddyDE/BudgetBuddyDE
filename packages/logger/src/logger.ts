import {normalizeLogEvent} from './normalizer';
import type {LogContext, LogEventWriter, LogLevel, Logger, LoggerOptions, LogThreshold} from './types';

const levelPriority: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

function shouldWrite(level: LogLevel, threshold: LogThreshold): boolean {
  return threshold !== 'silent' && levelPriority[level] >= levelPriority[threshold];
}

function isLoggerOptions(value: LogContext | LoggerOptions): value is LoggerOptions {
  return (
    Object.prototype.hasOwnProperty.call(value, 'context') || Object.prototype.hasOwnProperty.call(value, 'threshold')
  );
}

class EventLogger implements Logger {
  constructor(
    private readonly writer: LogEventWriter,
    private readonly rootContext: LogContext,
    private readonly childContext: LogContext,
    private readonly threshold: LogThreshold,
  ) {}

  trace(message: string | Error, ...args: unknown[]): void {
    this.log('trace', message, args);
  }

  debug(message: string | Error, ...args: unknown[]): void {
    this.log('debug', message, args);
  }

  info(message: string | Error, ...args: unknown[]): void {
    this.log('info', message, args);
  }

  warn(message: string | Error, ...args: unknown[]): void {
    this.log('warn', message, args);
  }

  error(message: string | Error, ...args: unknown[]): void {
    this.log('error', message, args);
  }

  child(context: LogContext): Logger {
    return new EventLogger(this.writer, this.rootContext, {...this.childContext, ...context}, this.threshold);
  }

  private log(level: LogLevel, message: string | Error, args: unknown[]): void {
    if (!shouldWrite(level, this.threshold)) return;

    this.writer(
      normalizeLogEvent(level, message, args, {rootContext: this.rootContext, childContext: this.childContext}),
    );
  }
}

/** Creates a runtime-neutral logger that sends normalized events to a writer. */
export function createLogger(writer: LogEventWriter, options?: LoggerOptions): Logger;
export function createLogger(writer: LogEventWriter, context?: LogContext, threshold?: LogThreshold): Logger;
export function createLogger(
  writer: LogEventWriter,
  optionsOrContext: LoggerOptions | LogContext = {},
  threshold?: LogThreshold,
): Logger {
  const options = isLoggerOptions(optionsOrContext) ? optionsOrContext : {context: optionsOrContext, threshold};
  return new EventLogger(writer, options.context ?? {}, {}, options.threshold ?? 'trace');
}

/** Creates a logger that drops all events while retaining the Logger API. */
export function createNoopLogger(context: LogContext = {}): Logger {
  return createLogger(() => undefined, {context, threshold: 'silent'});
}

/** Parses environment-style values and maps the legacy `crit` level to `error`. */
export function getLogLevel(value: string | undefined): LogThreshold {
  switch (value?.trim().toLowerCase()) {
    case 'trace':
    case 'debug':
    case 'info':
    case 'warn':
    case 'error':
    case 'silent':
      return value.trim().toLowerCase() as LogThreshold;
    case 'crit':
      return 'error';
    default:
      return 'info';
  }
}
