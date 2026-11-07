import {sanitizeSpan} from './sanitizeSpan';

it('preserves useful timing metadata while removing SQL, URLs, errors, and linked secrets', () => {
  const span = {
    name: 'SELECT email FROM users WHERE id = 123',
    kind: 2,
    instrumentationScope: {name: '@opentelemetry/instrumentation-pg'},
    attributes: {
      'db.system': 'postgresql',
      'db.operation.name': 'SELECT',
      'db.statement': 'SELECT secret',
      'url.full': 'https://example.com/?token=secret',
      'http.request.header.authorization': 'secret',
    },
    status: {code: 2, message: 'password secret'},
    events: [{name: 'exception', attributes: {'exception.type': 'Error', 'exception.message': 'secret'}}],
    links: [{attributes: {token: 'secret'}}],
  };
  const safe = sanitizeSpan(span);
  expect(safe.name).toBe('postgresql.operation');
  expect(safe.attributes).toEqual({'db.system': 'postgresql', 'db.operation.name': 'SELECT'});
  expect(safe.events[0].attributes).toEqual({'exception.type': 'Error'});
  expect(safe.status).toEqual({code: 2});
  expect(safe.links[0].attributes).toEqual({});
  expect(span.attributes['db.statement']).toBe('SELECT secret');
});

it('preserves job counters and discards untrusted method and operation names', () => {
  const safe = sanitizeSpan({
    name: 'recurring_payments.run',
    kind: 0,
    instrumentationScope: {name: 'budgetbuddyde-backend'},
    attributes: {
      'job.name': 'process-recurring-payments',
      'job.processed': 3,
      'http.method': 'secret',
      'db.operation.name': 'SELECT sensitive',
    },
    status: {code: 0},
    events: [],
    links: [],
  });
  expect(safe.name).toBe('recurring_payments.run');
  expect(safe.attributes).toEqual({'job.name': 'process-recurring-payments', 'job.processed': 3});
});

it('keeps Next.js operation types without exporting route or query values', () => {
  const safe = sanitizeSpan({
    name: 'GET /transactions?token=secret',
    kind: 1,
    instrumentationScope: {name: 'next.js'},
    attributes: {'next.span_type': 'BaseServer.handleRequest', 'http.route': '/transactions/secret'},
    status: {code: 0},
    events: [],
    links: [],
  });
  expect(safe.name).toBe('BaseServer.handleRequest');
  expect(safe.attributes).toEqual({'http.route': '/transactions/:value'});
});

it('keeps only sanitized paths from browser fetch URLs', () => {
  const safe = sanitizeSpan({
    name: 'GET https://user:secret@example.com/api/transactions/private?token=secret',
    kind: 2,
    instrumentationScope: {name: '@opentelemetry/instrumentation-fetch'},
    attributes: {'http.url': 'https://user:secret@example.com/api/transactions/private?token=secret'},
    status: {code: 0},
    events: [],
    links: [],
  });
  expect(safe.attributes).toEqual({'http.route': '/api/transactions/:value'});
  expect(JSON.stringify(safe)).not.toContain('secret');
  expect(JSON.stringify(safe)).not.toContain('private');
});
