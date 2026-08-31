import type {Logger as WinstonLogger} from 'winston';
import type {LogEvent, LogSink} from './types';

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
  [key: string]: unknown;
}

export interface WinstonLogEvent {
  level: string;
  message: string;
  error?: SerializedError;
  [key: string]: unknown;
}

function serializeValue(value: unknown, seen: WeakSet<object>): unknown {
  if (value instanceof Error) return serializeError(value, seen);
  if (value === null || typeof value !== 'object') return typeof value === 'bigint' ? value.toString() : value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) return value.map(item => serializeValue(item, seen));

  const serialized: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    serialized[key] =
      descriptor && 'value' in descriptor ? serializeValue(descriptor.value, seen) : '[Unreadable property]';
  }
  return serialized;
}

/** Converts an Error into JSON-safe data while retaining own, including non-enumerable, properties. */
export function serializeError(error: Error, seen: WeakSet<object> = new WeakSet()): SerializedError {
  if (seen.has(error)) return {name: error.name, message: '[Circular]'};
  seen.add(error);

  const serialized: SerializedError = {name: error.name, message: error.message};
  for (const key of Object.getOwnPropertyNames(error)) {
    if (key === 'cause') continue;

    const descriptor = Object.getOwnPropertyDescriptor(error, key);
    serialized[key] =
      descriptor && 'value' in descriptor ? serializeValue(descriptor.value, seen) : '[Unreadable property]';
  }

  for (const symbol of Object.getOwnPropertySymbols(error)) {
    const descriptor = Object.getOwnPropertyDescriptor(error, symbol);
    serialized[`[${symbol.toString()}]`] =
      descriptor && 'value' in descriptor ? serializeValue(descriptor.value, seen) : '[Unreadable property]';
  }

  serialized.name = error.name;
  serialized.message = error.message;
  if (error.stack !== undefined) serialized.stack = error.stack;
  if ('cause' in error && error.cause !== undefined) serialized.cause = serializeValue(error.cause, seen);
  return serialized;
}

/** Converts a core event to Winston's object form without using Winston's splat metadata. */
export function toWinstonLogEvent(event: LogEvent): WinstonLogEvent {
  const {error, ...eventData} = event;
  return error ? ({...eventData, error: serializeError(error)} as WinstonLogEvent) : (eventData as WinstonLogEvent);
}

/** Creates a sink for an existing Winston logger. Import this module only where Winston is installed. */
export function createWinstonSink(logger: WinstonLogger): LogSink {
  return event => {
    logger.log(toWinstonLogEvent(event));
  };
}

/** @deprecated Use {@link createWinstonSink}. */
export const createWinstonLogEventWriter = createWinstonSink;
/** @deprecated Use {@link createWinstonSink}. */
export const createWinstonWriter = createWinstonSink;
