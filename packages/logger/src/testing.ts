import {createLogger} from './logger';
import type {LogContext, LogEvent, Logger, LoggerOptions} from './types';

/** In-memory logger for tests. Child loggers append to the same event collection. */
export class MemoryLogger implements Logger {
  readonly events: LogEvent[] = [];
  private readonly logger: Logger;

  constructor(options: LoggerOptions = {}) {
    this.logger = createLogger({
      ...options,
      sinks: [event => this.events.push(event), ...(options.sinks ?? [])],
    });
  }

  trace(message: string | Error, ...args: unknown[]): void {
    this.logger.trace(message, ...args);
  }

  debug(message: string | Error, ...args: unknown[]): void {
    this.logger.debug(message, ...args);
  }

  info(message: string | Error, ...args: unknown[]): void {
    this.logger.info(message, ...args);
  }

  warn(message: string | Error, ...args: unknown[]): void {
    this.logger.warn(message, ...args);
  }

  error(message: string | Error, ...args: unknown[]): void {
    this.logger.error(message, ...args);
  }

  child(context: LogContext): Logger {
    return this.logger.child(context);
  }

  clear(): void {
    this.events.length = 0;
  }
}
