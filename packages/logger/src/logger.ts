import {normalizeLogEvent} from './normalizer';
import type {LogContext, LogLevel, Logger, LoggerOptions, LogSink, LogThreshold} from './types';

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

class EventLogger implements Logger {
  constructor(
    private readonly sinks: readonly LogSink[],
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
    return new EventLogger(this.sinks, this.rootContext, {...this.childContext, ...context}, this.threshold);
  }

  private log(level: LogLevel, message: string | Error, args: unknown[]): void {
    if (!shouldWrite(level, this.threshold)) return;

    const event = normalizeLogEvent(level, message, args, {
      rootContext: this.rootContext,
      childContext: this.childContext,
    });
    for (const sink of this.sinks) sink(event);
  }
}

/** Creates a runtime-neutral logger that sends normalized events to configured sinks. */
export function createLogger(options?: LoggerOptions): Logger;
/** @deprecated Pass `sinks` through a {@link LoggerOptions} object instead. */
export function createLogger(sink: LogSink, options?: Omit<LoggerOptions, 'sinks'>): Logger;
export function createLogger(
  optionsOrSink: LoggerOptions | LogSink = {},
  legacyOptions: Omit<LoggerOptions, 'sinks'> = {},
): Logger {
  const options = typeof optionsOrSink === 'function' ? {...legacyOptions, sinks: [optionsOrSink]} : optionsOrSink;
  return new EventLogger(options.sinks ?? [], options.context ?? {}, {}, options.threshold ?? 'trace');
}

/** Creates a logger that drops all events while retaining the Logger API. */
export function createNoopLogger(context: LogContext = {}): Logger {
  return createLogger({context, threshold: 'silent'});
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
