import {createNoopLogger, type Logger} from '@budgetbuddyde/logger';

/** Structured metadata attached to every decorator log entry. */
export type LogMeta = Record<string, unknown>;

type DecoratorLogger = Pick<Logger, 'debug' | 'warn' | 'error'>;

const REDACT_KEYS = ['authorization', 'cookie', 'password', 'secret', 'token', 'apiKey'];
const SLOW_THRESHOLD_MS = 500;

const noopLogger = createNoopLogger();

function isDecoratorLogger(value: unknown): value is DecoratorLogger {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as DecoratorLogger).debug === 'function' &&
    typeof (value as DecoratorLogger).warn === 'function' &&
    typeof (value as DecoratorLogger).error === 'function'
  );
}

function getInstanceLogger(value: unknown): DecoratorLogger | undefined {
  if (typeof value !== 'object' || value === null || !('logger' in value)) return undefined;
  return isDecoratorLogger(value.logger) ? value.logger : undefined;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';
}

function isRedactedKey(key: string) {
  const normalizedKey = key.toLowerCase();
  return REDACT_KEYS.some(redactKey => normalizedKey.includes(redactKey.toLowerCase()));
}

function sanitizeValue(value: unknown, seen: WeakSet<object>, depth = 0): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (depth >= 3) return '[MaxDepth]';
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (value instanceof Error) return errorMeta(value);
  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length,
      items: value.slice(0, 5).map(item => sanitizeValue(item, seen, depth + 1)),
    };
  }

  const objectValue = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(objectValue)
      .slice(0, 30)
      .map(([key, nestedValue]) => [
        key,
        isRedactedKey(key) ? '[Redacted]' : sanitizeValue(nestedValue, seen, depth + 1),
      ]),
  );
}

function errorMeta(error: unknown): LogMeta {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {value: stringifyObjectOrArray(sanitizeValue(error, new WeakSet<object>()))};
}

function stringifyObjectOrArray(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  return JSON.stringify(value);
}

function getReturnedError(value: unknown): Error | undefined {
  if (Array.isArray(value) && value.length === 2 && value[1] instanceof Error) return value[1];
  return undefined;
}

function summarizeResult(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    if (value.length === 2 && (value[1] === null || value[1] instanceof Error)) {
      return {
        type: 'serviceResult',
        hasData: value[0] !== null && value[0] !== undefined,
        hasError: value[1] !== null,
        data: summarizeResult(value[0]),
      };
    }
    return {type: 'array', length: value.length};
  }

  const objectValue = value as Record<string, unknown>;
  const summary: LogMeta = {type: 'object', keys: Object.keys(objectValue).slice(0, 30)};
  for (const key of ['id', 'status', 'totalCount', 'count']) {
    if (key in objectValue && !isRedactedKey(key)) summary[key] = objectValue[key];
  }
  for (const key of ['data', 'items', 'results']) {
    if (Array.isArray(objectValue[key])) summary[`${key}Length`] = objectValue[key].length;
  }
  return summary;
}

function getDurationMs(startedAt: number) {
  return Math.round((Date.now() - startedAt) * 100) / 100;
}

/**
 * Logs a method call using safe defaults: arguments are never logged, results are
 * emitted as bounded summaries, and slow calls are warned about.
 *
 * Synchronous exceptions, rejected promises, service-result errors, durations,
 * and bounded result summaries are recorded without changing the method contract.
 */
export function log<This, Args extends unknown[], Return>(
  originalMethod: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
): (this: This, ...args: Args) => Return {
  return function (this: This, ...args: Args): Return {
    const logger = getInstanceLogger(this) ?? noopLogger;
    const className = this && typeof this === 'object' ? this.constructor?.name : 'UnknownClass';
    const methodName = String(context.name);
    const startedAt = Date.now();
    const baseMeta: LogMeta = {className, methodName};

    logger.debug('Method called', baseMeta);

    const handleSuccess = (value: unknown) => {
      const durationMs = getDurationMs(startedAt);
      const returnedError = getReturnedError(value);
      const meta: LogMeta = {
        ...baseMeta,
        status: returnedError ? 'error' : 'success',
        durationMs,
        result: stringifyObjectOrArray(summarizeResult(value)),
        ...(returnedError ? {error: errorMeta(returnedError)} : {}),
      };
      if (returnedError) logger.error('Method returned an error result', returnedError, meta);
      else if (durationMs >= SLOW_THRESHOLD_MS) logger.warn('Slow method call', meta);
      else logger.debug('Method finished', meta);
      return value;
    };

    const handleFailure = (error: unknown): never => {
      const meta: LogMeta = {
        ...baseMeta,
        status: 'error',
        durationMs: getDurationMs(startedAt),
      };
      if (error instanceof Error) logger.error('Method failed', error, meta);
      else logger.error('Method failed', {...meta, error: errorMeta(error)});
      throw error;
    };

    try {
      const result = originalMethod.call(this, ...args);
      if (isPromiseLike(result)) {
        return result.then(handleSuccess, handleFailure) as Return;
      }
      return handleSuccess(result) as Return;
    } catch (error) {
      return handleFailure(error) as Return;
    }
  };
}
