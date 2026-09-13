# Backend Optimization Plan

Scope: `services/backend`

This plan tracks the backend optimization work identified during the architecture, security, and performance review.

## Decisions

- Direct deletion of categories and payment methods keeps the existing `ON DELETE CASCADE` behavior.
- Application imports in `commit` mode should become fully atomic: either all validated data is imported or nothing is
  persisted.
- No new dependency is required for the planned router tests. Native Node.js `fetch`, `FormData`, and `Blob` are
  sufficient.
- Duplicate prevention for recurring-payment executions is intentionally out of scope.

## Phase 1: Critical Bugs

Status: **completed**

### Fixes

- [x] Correct payment-method merge to update transactions through `paymentMethodId` instead of `categoryId`.
- [x] Validate category and payment-method ownership for single transaction create and update requests.
- [x] Validate category ownership for single budget create and update requests.
- [x] Return `404` for unknown budgets and calculate budget balances with the authenticated owner ID.
- [x] Validate transaction ownership before accepting attachment uploads.
- [x] Filter transaction attachment previews by attachment owner as defense in depth.

### Commits

- `1b23e1c0` `fix(backend): merge transactions by payment method`
- `a3a2c10e` `fix(backend): validate ownership of write references`
- `7076efdd` `fix(backend): return scoped budget balances by id`
- `bd3a8ccc` `fix(backend): isolate transaction attachments by owner`

### Verification

- 99 backend tests passed.
- Backend formatting check passed.
- Backend lint check passed.
- Backend typecheck passed.
- Backend build passed.

## Phase 2: Consistency

Status: **completed**

### Recurring-payment execution

- [x] Move the candidate query into the job error boundary.
- [x] Bound recurring-payment processing concurrency.
- [x] Invalidate transaction, budget, and insight caches after successful executions.

Duplicate execution prevention is intentionally not implemented. Multiple scheduler instances or retries can still create
duplicate transactions and remain an accepted limitation.

Primary files:

- `services/backend/src/jobs/processRecurringPayments.ts`
- `services/backend/src/router/recurringPayment.router.ts`

### Cache consistency

- [x] Define complete mutation dependencies for transaction, recurring-payment, category, payment-method, budget, and
      insight routes.
- [x] Invalidate only after successful database commits.
- [x] Replace Redis `SCAN`-based invalidation with per-user route generation counters in cache keys.
- [x] Cover mutation dependencies and concurrent GET/mutation races with tests.

Primary file:

- `services/backend/src/middleware/cache.middleware.ts`

### Attachment storage consistency

- [x] Add reliable compensating cleanup for attachment storage operations.
- [x] Remove uploaded S3 objects when database registration or a later upload fails.
- [x] Make database deletion and S3 cleanup retryable and observable.
- [x] Add partial S3 failure and database failure tests.

Cleanup retries are request-scoped. A durable outbox for recovery after a process crash remains a future enhancement.

Primary files:

- `services/backend/src/lib/attachment/attachment.handler.ts`
- `services/backend/src/lib/attachment/transaction-attachment.handler.ts`

### Commits

- `7b1d4085` `fix(backend): harden recurring payment processing`
- `a9e5c13e` `fix(backend): make response cache invalidation consistent`
- `9f120852` `fix(backend): compensate failed attachment storage operations`

## Phase 3: Query Performance

Status: **completed**

### Pagination

- [x] Introduce one shared pagination schema for list endpoints.
- [x] Require non-negative integer offsets.
- [x] Apply a default page size and maximum page size.
- [x] Reject ranges where `to < from`.
- [x] Preserve the current exclusive `to` range semantics.

The maximum window is enforced only when `to` is supplied; omitting `to` keeps the previous unbounded behavior so
existing callers are not truncated.

Affected routers:

- `services/backend/src/router/category.router.ts`
- `services/backend/src/router/paymentMethod.router.ts`
- `services/backend/src/router/transaction.router.ts`
- `services/backend/src/router/recurringPayment.router.ts`
- `services/backend/src/router/budget.router.ts`

### Budget and insight queries

- [x] Replace per-budget balance queries with one grouped query.
- [x] Collapse the four transaction scans in `/api/budget/estimated` into one conditional aggregate query.
- [ ] Measure the result with `EXPLAIN (ANALYZE, BUFFERS)`.

Query-plan measurement is deferred because no PostgreSQL instance was available; the changes were verified with mocked
tests only.

Primary files:

- `services/backend/src/router/budget.router.ts`
- `services/backend/src/router/insights.router.ts`

### Attachment previews

- [x] Return only the configured preview rows per transaction at database level.
- [x] Keep the full attachment count without loading all attachment rows into application memory.
- [x] Add deterministic ordering by `createdAt` and `id`.
- [x] Add an index supporting transaction-attachment lookup.

Primary file:

- `services/backend/src/router/transaction.router.ts`

### Database indexes

- [ ] Capture representative query plans before adding indexes.
- [x] Evaluate transaction indexes for owner, date, category, and payment-method filters.
- [x] Evaluate owner and update-date indexes for categories, payment methods, and budgets.
- [x] Evaluate attachment junction lookup indexes.
- [x] Evaluate an index aligned with the global recurring-payment job query.
- [ ] Consider PostgreSQL trigram indexes for search filters only after measurement.

Indexes were added from the known query shapes; plan capture and trigram evaluation are deferred until a representative
database is available.

Primary file:

- `packages/db/src/backend/tables.ts`

## Phase 4: Import, Export, and Resource Limits

Status: **completed**

### Import

- [x] Parse and validate the complete archive before writing.
- [x] Load existing and owned records with bulk `IN` queries.
- [x] Resolve references in memory.
- [x] Persist commit-mode imports in one database transaction.
- [x] Use bounded insert chunks where required by PostgreSQL parameter limits.
- [x] Distinguish malformed input errors from infrastructure errors.
- [x] Add atomicity and large-import tests.

Primary files:

- `services/backend/src/router/applicationImport.ts`
- `services/backend/src/router/application.router.ts`

### Export

- [x] Add an explicit export size limit.
- [x] Bound attachment-download concurrency.
- [ ] Stream database records and archive output where practical.
- [x] Avoid synchronous ZIP work on the request event loop for large exports.
- [ ] Consider asynchronous export jobs for large archives.

ZIP assembly is asynchronous and yields between CRC chunks; true streaming and asynchronous export jobs are deferred as
future enhancements.

Primary files:

- `services/backend/src/router/application.router.ts`
- `services/backend/src/router/applicationExport.ts`

### Upload processing

- [x] Add a total request-size limit in addition to the per-file limit.
- [x] Bound image processing and S3 upload concurrency.
- [x] Replace synchronous `gzipSync` with asynchronous or streaming compression.
- [x] Validate file signatures and decoded image dimensions.
- [ ] Consider temporary-file-backed or streaming uploads for larger workloads.

Temporary-file-backed uploads are deferred; uploads remain memory-backed and are bounded by the request-size limit.

Primary files:

- `services/backend/src/router/transaction.router.ts`
- `services/backend/src/lib/attachment/attachment.handler.ts`

### Signed URL cache

- [x] Include TTL in signed URL cache keys or cache only the default TTL.
- [x] Use Redis bulk reads and pipelined writes for attachment URL generation.
- [x] Cache URLs for less than their actual expiration time.

Only the default TTL is cached; custom TTLs bypass the cache. Signed URLs are cached 60 seconds below their actual
expiration.

Primary files:

- `services/backend/src/lib/cache/attachment.cache.ts`
- `services/backend/src/lib/attachment/attachment.handler.ts`

## Phase 5: Operations and Maintainability

Status: **completed**

### Application lifecycle

- [x] Separate `createApp()` from `startServer()`.
- [x] Add graceful shutdown for HTTP, PostgreSQL, Redis, S3, and scheduled jobs.
- [x] Use lightweight bounded health checks.
- [x] Restrict health endpoints to `GET` and `HEAD`.
- [x] Decide whether Redis is optional or mandatory and align configuration, health, and attachment behavior.

Redis is optional: caching, rate limiting, health reporting, and the attachment cache all degrade when `REDIS_URL` is
unset.

Primary files:

- `services/backend/src/server.ts`
- `services/backend/src/db/pool.ts`
- `services/backend/src/db/redis.ts`

### Authentication and request observability

- [x] Add a timeout to the auth-service request.
- [x] Forward only required authentication headers.
- [x] Return generic authentication failures to clients and log upstream details server-side.
- [x] Move basic request logging before authentication.
- [x] Record request duration, request ID, user ID, and authentication method.
- [x] Configure `trust proxy` for the deployment topology.
- [x] Either implement API-key permission checks or remove the unused permission context.

The unused `authenticationMethod`/permission context was removed; requests now log a request ID, duration, and user ID.
`trust proxy` defaults to `1` in production and can be overridden with `TRUST_PROXY`.

Primary files:

- `services/backend/src/middleware/setRequestContext.middleware.ts`
- `services/backend/src/middleware/logRequest.middleware.ts`
- `services/backend/src/types/RequestContext.ts`
- `services/backend/src/server.ts`

### Error handling and cleanup

- [x] Preserve server-side error diagnostics while returning safe client messages.
- [x] Return explicit `404` and `409` responses for known outcomes.
- [x] Add a final API `404` handler.
- [x] Remove redundant `body-parser` usage in favor of Express JSON parsing.
- [x] Remove confirmed unused exports and helpers.
- [x] Correct the backend Vitest project name from `auth-service`.
- [x] Resolve the attachment owner foreign-key mismatch between `NOT NULL` and `ON DELETE SET NULL`.

Primary files:

- `services/backend/src/models/ApiResponse.ts`
- `services/backend/src/middleware/handleError.middleware.ts`
- `services/backend/src/server.ts`
- `services/backend/vitest.config.ts`
- `packages/db/src/backend/tables.ts`

## Verification Standard

For each implementation phase, run the narrow tests first, then the complete backend checks:

```bash
npm test --workspace services/backend
npm run check --workspace services/backend
npm run typecheck --workspace services/backend
npm run build --workspace services/backend
```

Database changes additionally require migration validation, owner-isolation tests, and query-plan comparisons with
representative data.

Phase 3–5 were implemented without a running PostgreSQL/Redis instance. Migrations were generated with
`drizzle-kit generate` and all checks ran against the mocked test suite; live migration validation and query-plan
comparisons remain outstanding.
