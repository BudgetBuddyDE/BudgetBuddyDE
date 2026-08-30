import type {LogEventWriter} from './types';

export interface ConsoleLike {
  trace?: (...data: unknown[]) => void;
  debug?: (...data: unknown[]) => void;
  info?: (...data: unknown[]) => void;
  warn?: (...data: unknown[]) => void;
  error?: (...data: unknown[]) => void;
  log?: (...data: unknown[]) => void;
}

/** Creates a browser-safe writer that forwards complete events to the matching console method. */
export function createConsoleLogEventWriter(target: ConsoleLike | undefined = globalThis.console): LogEventWriter {
  return event => {
    const method = target?.[event.level] ?? target?.log;
    if (typeof method === 'function') method.call(target, event);
  };
}

export const createConsoleWriter = createConsoleLogEventWriter;
