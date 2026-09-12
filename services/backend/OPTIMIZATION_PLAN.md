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

Status: **open**

### Pagination

- [ ] Introduce one shared pagination schema for list endpoints.
- [ ] Require non-negative integer offsets.
- [ ] Apply a default page size and maximum page size.
- [ ] Reject ranges where `to < from`.
- [ ] Preserve the current exclusive `to` range semantics.

Affected routers:

- `services/backend/src/router/category.router.ts`
- `services/backend/src/router/paymentMethod.router.ts`
- `services/backend/src/router/transaction.router.ts`
- `services/backend/src/router/recurringPayment.router.ts`
- `services/backend/src/router/budget.router.ts`

### Budget and insight queries

- [ ] Replace per-budget balance queries with one grouped query.
- [ ] Collapse the four transaction scans in `/api/budget/estimated` into one conditional aggregate query.
- [ ] Measure the result with `EXPLAIN (ANALYZE, BUFFERS)`.

Primary files:

- `services/backend/src/router/budget.router.ts`
- `services/backend/src/router/insights.router.ts`

### Attachment previews

- [ ] Return only the configured preview rows per transaction at database level.
- [ ] Keep the full attachment count without loading all attachment rows into application memory.
- [ ] Add deterministic ordering by `createdAt` and `id`.
- [ ] Add an index supporting transaction-attachment lookup.

Primary file:

- `services/backend/src/router/transaction.router.ts`

### Database indexes

- [ ] Capture representative query plans before adding indexes.
- [ ] Evaluate transaction indexes for owner, date, category, and payment-method filters.
- [ ] Evaluate owner and update-date indexes for categories, payment methods, and budgets.
- [ ] Evaluate attachment junction lookup indexes.
- [ ] Evaluate an index aligned with the global recurring-payment job query.
- [ ] Consider PostgreSQL trigram indexes for search filters only after measurement.

Primary file:

- `packages/db/src/backend/tables.ts`

## Phase 4: Import, Export, and Resource Limits

Status: **open**

### Import

- [ ] Parse and validate the complete archive before writing.
- [ ] Load existing and owned records with bulk `IN` queries.
- [ ] Resolve references in memory.
- [ ] Persist commit-mode imports in one database transaction.
- [ ] Use bounded insert chunks where required by PostgreSQL parameter limits.
- [ ] Distinguish malformed input errors from infrastructure errors.
- [ ] Add atomicity and large-import tests.

Primary files:

- `services/backend/src/router/applicationImport.ts`
- `services/backend/src/router/application.router.ts`

### Export

- [ ] Add an explicit export size limit.
- [ ] Bound attachment-download concurrency.
- [ ] Stream database records and archive output where practical.
- [ ] Avoid synchronous ZIP work on the request event loop for large exports.
- [ ] Consider asynchronous export jobs for large archives.

Primary files:

- `services/backend/src/router/application.router.ts`
- `services/backend/src/router/applicationExport.ts`

### Upload processing

- [ ] Add a total request-size limit in addition to the per-file limit.
- [ ] Bound image processing and S3 upload concurrency.
- [ ] Replace synchronous `gzipSync` with asynchronous or streaming compression.
- [ ] Validate file signatures and decoded image dimensions.
- [ ] Consider temporary-file-backed or streaming uploads for larger workloads.

Primary files:

- `services/backend/src/router/transaction.router.ts`
- `services/backend/src/lib/attachment/attachment.handler.ts`

### Signed URL cache

- [ ] Include TTL in signed URL cache keys or cache only the default TTL.
- [ ] Use Redis bulk reads and pipelined writes for attachment URL generation.
- [ ] Cache URLs for less than their actual expiration time.

Primary files:

- `services/backend/src/lib/cache/attachment.cache.ts`
- `services/backend/src/lib/attachment/attachment.handler.ts`

## Phase 5: Operations and Maintainability

Status: **open**

### Application lifecycle

- [ ] Separate `createApp()` from `startServer()`.
- [ ] Add graceful shutdown for HTTP, PostgreSQL, Redis, S3, and scheduled jobs.
- [ ] Use lightweight bounded health checks.
- [ ] Restrict health endpoints to `GET` and `HEAD`.
- [ ] Decide whether Redis is optional or mandatory and align configuration, health, and attachment behavior.

Primary files:

- `services/backend/src/server.ts`
- `services/backend/src/db/pool.ts`
- `services/backend/src/db/redis.ts`

### Authentication and request observability

- [ ] Add a timeout to the auth-service request.
- [ ] Forward only required authentication headers.
- [ ] Return generic authentication failures to clients and log upstream details server-side.
- [ ] Move basic request logging before authentication.
- [ ] Record request duration, request ID, user ID, and authentication method.
- [ ] Configure `trust proxy` for the deployment topology.
- [ ] Either implement API-key permission checks or remove the unused permission context.

Primary files:

- `services/backend/src/middleware/setRequestContext.middleware.ts`
- `services/backend/src/middleware/logRequest.middleware.ts`
- `services/backend/src/types/RequestContext.ts`
- `services/backend/src/server.ts`

### Error handling and cleanup

- [ ] Preserve server-side error diagnostics while returning safe client messages.
- [ ] Return explicit `404` and `409` responses for known outcomes.
- [ ] Add a final API `404` handler.
- [ ] Remove redundant `body-parser` usage in favor of Express JSON parsing.
- [ ] Remove confirmed unused exports and helpers.
- [ ] Correct the backend Vitest project name from `auth-service`.
- [ ] Resolve the attachment owner foreign-key mismatch between `NOT NULL` and `ON DELETE SET NULL`.

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
