const NUMERIC_ATTRIBUTES = new Set([
  'http.status_code',
  'http.response.status_code',
  'batch.size',
  'batch.failed',
  'job.processed',
  'job.skipped',
  'job.failed',
  'cache.route_count',
  'cache.hit',
  'export.resource_count',
  'import.archive_bytes',
]);

const PUBLIC_ROUTE_SEGMENTS = new Set([
  'api',
  'auth',
  'me',
  'health',
  'status',
  'mcp',
  'dashboard',
  'insights',
  'budget',
  'category',
  'categories',
  'paymentMethod',
  'paymentMethods',
  'recurringPayment',
  'recurringPayments',
  'transaction',
  'transactions',
  'attachment',
  'attachments',
  'application',
  'import',
  'export',
  'batch',
  'occurrences',
  'execute',
  'settings',
  'profile',
  'api-keys',
  'sign-in',
  'sign-up',
  'password',
  'email',
  'user',
]);

/** Produces a safe export view without changing the active span seen by application code. */
export function sanitizeSpan<
  T extends {
    name: string;
    kind: number;
    attributes: Record<string, unknown>;
    status: {code: number};
    events: {name: string; attributes?: Record<string, unknown>}[];
    links: {attributes?: Record<string, unknown>}[];
    instrumentationScope: {name: string};
  },
>(span: T): T {
  const attributes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(span.attributes)) {
    if (NUMERIC_ATTRIBUTES.has(key) && (typeof value === 'number' || typeof value === 'boolean'))
      attributes[key] = value;
    if (
      (key === 'http.method' || key === 'http.request.method') &&
      typeof value === 'string' &&
      /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|CONNECT|TRACE|_OTHER)$/.test(value)
    )
      attributes[key] = value;
    if ((key === 'db.system' || key === 'db.system.name') && (value === 'postgresql' || value === 'redis'))
      attributes[key] = value;
    if (
      key === 'db.operation.name' &&
      typeof value === 'string' &&
      /^(SELECT|INSERT|UPDATE|DELETE|BEGIN|COMMIT|ROLLBACK|GET|SET|DEL)$/.test(value)
    )
      attributes[key] = value;
    if (key === 'network.protocol.version' && (value === '1.0' || value === '1.1' || value === '2' || value === '3'))
      attributes[key] = value;
    if (key === 'job.name' && value === 'process-recurring-payments') attributes[key] = value;
    if (key === 'job.scheduled_for' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
      attributes[key] = value;
    if (key === 'import.mode' && (value === 'preview' || value === 'commit')) attributes[key] = value;
  }
  let path =
    span.attributes['http.route'] ??
    span.attributes['url.path'] ??
    span.attributes['http.target'] ??
    span.attributes['next.route'] ??
    span.attributes['url.full'] ??
    span.attributes['http.url'];
  if (typeof path === 'string' && !path.startsWith('/')) {
    try {
      path = new URL(path).pathname;
    } catch {
      path = undefined;
    }
  }
  if (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !span.instrumentationScope.name.includes('pg') &&
    !span.instrumentationScope.name.includes('redis')
  ) {
    attributes['http.route'] = path
      .split(/[?#]/, 1)[0]
      .split('/')
      .map(segment => (!segment || PUBLIC_ROUTE_SEGMENTS.has(segment) ? segment : ':value'))
      .join('/');
  }
  // The PostgreSQL instrumentation records the query text but not always its operation name.
  // Retain only a known SQL verb, never the query itself or its parameters.
  const query = span.attributes['db.query.text'] ?? span.attributes['db.statement'];
  if (span.instrumentationScope.name.includes('pg') && typeof query === 'string') {
    const operation = /^\s*(SELECT|INSERT|UPDATE|DELETE|BEGIN|COMMIT|ROLLBACK)\b/i.exec(query)?.[1];
    if (operation) attributes['db.operation.name'] = operation.toUpperCase();
  }
  const nextSpanType = span.attributes['next.span_type'];
  const expressType = span.attributes['express.type'];
  const expressName =
    span.instrumentationScope.name.includes('express') &&
    (expressType === 'router' || expressType === 'middleware' || expressType === 'request_handler')
      ? `express.${expressType}`
      : undefined;
  const nextName =
    span.instrumentationScope.name === 'next.js' &&
    typeof nextSpanType === 'string' &&
    /^(?:BaseServer|AppRender|NextNodeServer|NextServer|Render|LoadComponents|Router|RouteModule|ResolveMetadata)\.[A-Za-z]+$/.test(
      nextSpanType,
    )
      ? nextSpanType
      : undefined;
  const name = /^(?:recurring_payments|application|cache|insights)\.[a-z_.]+$/.test(span.name)
    ? span.name
    : expressName
      ? expressName
      : nextName
        ? nextName
        : span.instrumentationScope.name === 'next.js'
          ? 'next.request'
          : span.instrumentationScope.name.includes('pg')
            ? 'postgresql.operation'
            : span.instrumentationScope.name.includes('redis')
              ? 'redis.operation'
              : span.kind === 1
                ? 'http.server'
                : span.kind === 2
                  ? 'http.client'
                  : 'instrumented.operation';
  const safe = Object.create(span) as T;
  Object.defineProperties(safe, {
    name: {value: name, enumerable: true},
    attributes: {value: attributes, enumerable: true},
    status: {value: {code: span.status.code}, enumerable: true},
    events: {
      value: span.events.map(event => ({
        ...event,
        name: event.name === 'exception' ? 'exception' : 'event',
        attributes:
          event.name === 'exception' &&
          typeof event.attributes?.['exception.type'] === 'string' &&
          /^[A-Za-z][A-Za-z0-9_.]{0,79}$/.test(event.attributes['exception.type'])
            ? {'exception.type': event.attributes['exception.type']}
            : {},
      })),
      enumerable: true,
    },
    links: {value: span.links.map(link => ({...link, attributes: {}})), enumerable: true},
  });
  return safe;
}
