import type {LogSink} from './types';

export interface ConsoleLike {
  trace?: (...data: unknown[]) => void;
  debug?: (...data: unknown[]) => void;
  info?: (...data: unknown[]) => void;
  warn?: (...data: unknown[]) => void;
  error?: (...data: unknown[]) => void;
  log?: (...data: unknown[]) => void;
}

/** Creates a browser-safe sink that forwards complete events to the matching console method. */
export function createConsoleSink(target: ConsoleLike | undefined = globalThis.console): LogSink {
  return event => {
    const method = target?.[event.level] ?? target?.log;
    if (typeof method === 'function') method.call(target, event);
  };
}

/** @deprecated Use {@link createConsoleSink}. */
export const createConsoleLogEventWriter = createConsoleSink;
/** @deprecated Use {@link createConsoleSink}. */
export const createConsoleWriter = createConsoleSink;
