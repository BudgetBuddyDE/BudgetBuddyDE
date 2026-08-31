import type {LogEvent, LogSink} from './types';

export interface ConsoleLike {
  trace?: (...data: unknown[]) => void;
  debug?: (...data: unknown[]) => void;
  info?: (...data: unknown[]) => void;
  warn?: (...data: unknown[]) => void;
  error?: (...data: unknown[]) => void;
  log?: (...data: unknown[]) => void;
}

/** Formats an event into console arguments. */
export type ConsoleFormatter = (event: LogEvent) => readonly unknown[];

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
export function createConsoleSink({
  target = globalThis.console,
  formatter = event => [event],
}: ConsoleSinkOptions = {}): LogSink {
  return event => {
    const method = target?.[event.level] ?? target?.log;
    if (typeof method === 'function') method.call(target, ...formatter(event));
  };
}
