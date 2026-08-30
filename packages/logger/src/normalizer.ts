import type {LogContext, LogEvent, LogLevel} from './types';

const reservedEventFields = new Set(['level', 'message', 'error']);

function isPlainObject(value: unknown): value is LogContext {
  if (value === null || typeof value !== 'object') return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function stringifyJson(value: unknown): string {
  try {
    const result = JSON.stringify(value);
    return result === undefined ? 'undefined' : result;
  } catch {
    return '[Circular]';
  }
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) return stringifyJson(value);

  try {
    return String(value);
  } catch {
    return '[Unserializable]';
  }
}

function toNumber(value: unknown): number {
  try {
    return Number(value);
  } catch {
    return Number.NaN;
  }
}

function consumingPlaceholderCount(template: string): number {
  return (template.match(/%[sdj%]/g) ?? []).filter(placeholder => placeholder !== '%%').length;
}

function mergeContext(...contexts: Array<LogContext | undefined>): LogContext {
  const merged: LogContext = {};

  for (const context of contexts) {
    if (!context) continue;

    for (const [key, value] of Object.entries(context)) {
      if (!reservedEventFields.has(key)) merged[key] = value;
    }
  }

  return merged;
}

/** Formats a message without relying on Node's `util.format`. */
export function formatLogMessage(template: string, args: readonly unknown[]): string {
  let argumentIndex = 0;
  const formatted = template.replace(/%[sdj%]/g, placeholder => {
    if (placeholder === '%%') return '%';

    const value = args[argumentIndex++];
    switch (placeholder) {
      case '%s':
        return stringifyValue(value);
      case '%d':
        return String(toNumber(value));
      case '%j':
        return stringifyJson(value);
      default:
        return placeholder;
    }
  });

  const remaining = args.slice(argumentIndex);
  return remaining.length === 0 ? formatted : `${formatted} ${remaining.map(stringifyValue).join(' ')}`;
}

export interface NormalizeLogEventOptions {
  rootContext?: LogContext;
  childContext?: LogContext;
}

/**
 * Separates an Error and optional trailing call metadata before formatting a log event.
 */
export function normalizeLogEvent(
  level: LogLevel,
  message: string | Error,
  args: readonly unknown[],
  options: NormalizeLogEventOptions = {},
): LogEvent {
  const errors = [message, ...args].filter((value): value is Error => value instanceof Error);
  const template = typeof message === 'string' ? message : message.message;
  const nonErrorArgs = args.filter(value => !(value instanceof Error));
  const placeholderCount = consumingPlaceholderCount(template);
  const trailingArgument = nonErrorArgs[nonErrorArgs.length - 1];
  const hasCallMetadata = nonErrorArgs.length > placeholderCount && isPlainObject(trailingArgument);
  const formatArgs = hasCallMetadata ? nonErrorArgs.slice(0, -1) : nonErrorArgs;
  const context = mergeContext(
    options.rootContext,
    options.childContext,
    hasCallMetadata ? trailingArgument : undefined,
  );
  const event: LogEvent = {...context, level, message: formatLogMessage(template, formatArgs)};

  if (errors[0]) event.error = errors[0];
  return event;
}
