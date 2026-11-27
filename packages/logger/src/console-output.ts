import type {LogEvent} from './types';

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

export function writeConsoleEvent(
  target: ConsoleLike | undefined,
  event: LogEvent,
  formatter: ConsoleFormatter = event => [event],
): void {
  const method = target?.[event.level] ?? target?.log;
  if (typeof method === 'function') method.call(target, ...formatter(event));
}
