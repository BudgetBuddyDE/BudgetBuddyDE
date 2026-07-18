/** Structured metadata attached to every decorator log entry. */
export type LogMeta = Record<string, unknown>;

/** Minimal logger contract required by the decorator. */
export type LogSink = {
  debug: (message: string, meta: LogMeta) => void;
  warn: (message: string, meta: LogMeta) => void;
  error: (message: string, meta: LogMeta) => void;
};

/**
 * Configures method-call logging.
 *
 * Arguments are disabled by default to avoid leaking credentials or personal data.
 * Results are emitted as bounded summaries rather than full response payloads.
 */
export type LogOptions = {
  /** Logs sanitized method arguments when enabled. Defaults to `false`. */
  logArgs?: boolean;
  /** Logs a bounded result summary. Defaults to `true`. */
  logResult?: boolean;
  /** Emits a warning when a call takes at least this many milliseconds. */
  slowThresholdMs?: number;
  /** Case-insensitive property fragments that are replaced with `[Redacted]`. */
  redactKeys?: readonly string[];
  /** Replaces the default console-based sink. */
  logger?: LogSink;
};

const DEFAULT_REDACT_KEYS = ['authorization', 'cookie', 'password', 'secret', 'token', 'apiKey'];
const DEFAULT_OPTIONS: Required<Omit<LogOptions, 'logger'>> = {
  logArgs: false,
  logResult: true,
  slowThresholdMs: 500,
  redactKeys: DEFAULT_REDACT_KEYS,
};

const consoleSink: LogSink = {
  debug: (message, meta) => console.debug(message, meta),
  warn: (message, meta) => console.warn(message, meta),
  error: (message, meta) => console.error(message, meta),
};

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';
}

function errorMeta(error: unknown, redactKeys: readonly string[] = DEFAULT_REDACT_KEYS): LogMeta {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {value: stringifyObjectOrArray(sanitizeValue(error, new WeakSet<object>(), redactKeys))};
}

function isRedactedKey(key: string, redactKeys: readonly string[]) {
  const normalizedKey = key.toLowerCase();
  return redactKeys.some(redactKey => normalizedKey.includes(redactKey.toLowerCase()));
}

function sanitizeValue(value: unknown, seen: WeakSet<object>, redactKeys: readonly string[], depth = 0): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (depth >= 3) return '[MaxDepth]';
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (value instanceof Error) return errorMeta(value, redactKeys);
  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length,
      items: value.slice(0, 5).map(item => sanitizeValue(item, seen, redactKeys, depth + 1)),
    };
  }

  const objectValue = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(objectValue)
      .slice(0, 30)
      .map(([key, nestedValue]) => [
        key,
        isRedactedKey(key, redactKeys) ? '[Redacted]' : sanitizeValue(nestedValue, seen, redactKeys, depth + 1),
      ]),
  );
}

function stringifyObjectOrArray(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  return JSON.stringify(value);
}

function getReturnedError(value: unknown): Error | undefined {
  if (Array.isArray(value) && value.length === 2 && value[1] instanceof Error) return value[1];
  return undefined;
}

function summarizeResult(value: unknown, redactKeys: readonly string[]): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    if (value.length === 2 && (value[1] === null || value[1] instanceof Error)) {
      return {
        type: 'serviceResult',
        hasData: value[0] !== null && value[0] !== undefined,
        hasError: value[1] !== null,
        data: summarizeResult(value[0], redactKeys),
      };
    }
    return {type: 'array', length: value.length};
  }

  const objectValue = value as Record<string, unknown>;
  const summary: LogMeta = {type: 'object', keys: Object.keys(objectValue).slice(0, 30)};
  for (const key of ['id', 'status', 'totalCount', 'count']) {
    if (key in objectValue && !isRedactedKey(key, redactKeys)) summary[key] = objectValue[key];
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
 * Creates a configurable standard method decorator.
 *
 * @example
 * ```ts
 * @createLogDecorator({logArgs: false, logResult: true, slowThresholdMs: 500})
 * async loadData() {
 *   return fetchData();
 * }
 * ```
 */
export function createLogDecorator(options: LogOptions = {}) {
  const config = {...DEFAULT_OPTIONS, ...options};
  const sink = config.logger ?? consoleSink;

  return function <This, Args extends unknown[], Return>(
    originalMethod: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
  ): (this: This, ...args: Args) => Return {
    return function (this: This, ...args: Args): Return {
      const className = this && typeof this === 'object' ? this.constructor?.name : 'UnknownClass';
      const methodName = String(context.name);
      const startedAt = Date.now();
      const baseMeta: LogMeta = {className, methodName};

      sink.debug('Method called', {
        ...baseMeta,
        ...(config.logArgs
          ? {args: stringifyObjectOrArray(sanitizeValue(args, new WeakSet<object>(), config.redactKeys))}
          : {}),
      });

      const handleSuccess = (value: unknown) => {
        const durationMs = getDurationMs(startedAt);
        const returnedError = getReturnedError(value);
        const meta: LogMeta = {
          ...baseMeta,
          status: returnedError ? 'error' : 'success',
          durationMs,
          ...(config.logResult ? {result: stringifyObjectOrArray(summarizeResult(value, config.redactKeys))} : {}),
          ...(returnedError ? {error: errorMeta(returnedError, config.redactKeys)} : {}),
        };
        if (returnedError) sink.error('Method returned an error result', meta);
        else if (durationMs >= config.slowThresholdMs) sink.warn('Slow method call', meta);
        else sink.debug('Method finished', meta);
        return value;
      };

      const handleFailure = (error: unknown): never => {
        sink.error('Method failed', {
          ...baseMeta,
          status: 'error',
          durationMs: getDurationMs(startedAt),
          error: errorMeta(error, config.redactKeys),
        });
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
  };
}

type LogMethodDecorator = <This, Args extends unknown[], Return>(
  originalMethod: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) => (this: This, ...args: Args) => Return;

/**
 * Logs a method call using safe defaults or optional configuration.
 *
 * Both decorator forms are supported:
 *
 * ```ts
 * @log
 * loadData() {}
 *
 * @log({logArgs: true, slowThresholdMs: 250})
 * loadData() {}
 * ```
 *
 * Synchronous exceptions, rejected promises, service-result errors, durations,
 * and bounded result summaries are recorded without changing the method contract.
 */
export function log<This, Args extends unknown[], Return>(
  originalMethod: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
): (this: This, ...args: Args) => Return;
export function log(options?: LogOptions): LogMethodDecorator;
export function log(
  originalMethodOrOptions?: LogOptions | ((this: unknown, ...args: unknown[]) => unknown),
  context?: ClassMethodDecoratorContext<unknown, (this: unknown, ...args: unknown[]) => unknown>,
): LogMethodDecorator | ((this: unknown, ...args: unknown[]) => unknown) {
  if (typeof originalMethodOrOptions === 'function') {
    if (!context) throw new TypeError('The log decorator requires a method context.');
    return createLogDecorator()(originalMethodOrOptions, context);
  }

  return createLogDecorator(originalMethodOrOptions);
}
