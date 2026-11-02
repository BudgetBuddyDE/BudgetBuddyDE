import type {LogContext, LogEvent, LogLevel} from './types';

const reservedEventFields = new Set(['level', 'message', 'error']);
const sensitiveKey = /password|passwd|secret|token|authorization|api[-_.]?key|cookie|credential/i;
const redacted = '[REDACTED]';

export function redactText(value: string): string {
  return value
    .replace(/\b((?:set-)?cookie|authorization)\s*:\s*[^\r\n]*/gi, `$1: ${redacted}`)
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9+/=_%-]+/gi, `$1 ${redacted}`)
    .replace(/(https?:\/\/)[^\s/@:]+:[^\s/@]+@/gi, `$1${redacted}@`)
    .replace(
      /((?:["']?)(?:password|passwd|secret|[\w.-]*token|authorization|api[-_.]?key|cookie|credential)(?:["']?)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s&,;}]+)/gi,
      `$1${redacted}`,
    );
}

function sanitize(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (typeof value === 'string') return redactText(value);
  if (typeof value === 'bigint') return value.toString();
  if (value === null || typeof value !== 'object') return value;
  if (depth > 8 || seen.has(value)) return '[Circular or too deep]';
  seen.add(value);
  if (value instanceof Error) {
    const error = new Error(redactText(value.message));
    error.name = value.name;
    if (value.stack) error.stack = redactText(value.stack);
    return error;
  }
  if (Array.isArray(value)) return value.map(item => sanitize(item, seen, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKey.test(key) ? redacted : sanitize(item, seen, depth + 1),
    ]),
  );
}

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
  return String(value);
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
        return String(Number(value));
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
  const event: LogEvent = {...context, level, message: redactText(formatLogMessage(template, formatArgs))};

  if (errors[0]) event.error = sanitize(errors[0]) as Error;
  return sanitize(event) as LogEvent;
}
