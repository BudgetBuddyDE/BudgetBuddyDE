import {writeConsoleEvent} from './console-output';
import type {ConsoleFormatter, ConsoleLike} from './console-output';
import {createLogger} from './logger';
import type {LogContext, Logger, LogSink, LogThreshold} from './types';

export type {ConsoleFormatter, ConsoleLike} from './console-output';

export interface ConsoleSinkOptions {
  target?: ConsoleLike;
  formatter?: ConsoleFormatter;
}

function stringifyAttributes(attributes: Record<string, unknown>): string {
  try {
    return JSON.stringify(attributes, (_, value) => (typeof value === 'bigint' ? value.toString() : value));
  } catch {
    return '[Unserializable]';
  }
}

/** Formats events as `DATE [LEVEL] MESSAGE - ATTRIBUTES` and retains raw errors as a second console argument. */
export const formatConsoleEvent: ConsoleFormatter = event => {
  const {level, message, error, ...attributes} = event;
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message} - ${stringifyAttributes(attributes)}`;
  return error ? [line, error] : [line];
};

/** Creates a browser-safe sink that forwards events through the matching console method. */
export function createConsoleSink({target = globalThis.console, formatter}: ConsoleSinkOptions = {}): LogSink {
  return event => writeConsoleEvent(target, event, formatter);
}

/** Creates a logger that writes formatted console events for a service. */
export function createServiceLogger(context: LogContext, threshold: LogThreshold): Logger {
  return createLogger({
    sinks: [createConsoleSink({formatter: formatConsoleEvent})],
    context,
    threshold,
  });
}
