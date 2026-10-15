# Repository Guidelines

## Project Overview

BudgetBuddyDE is an open-source personal-finance manager for transactions, recurring payments, budgets, analytics, categories, payment methods, attachments, and insights. It is a strict TypeScript npm-workspace monorepo orchestrated by Turborepo, with a Next.js frontend and authenticated backend services.

## Architecture & Data Flow

- `apps/webapp` is a Next.js 16 App Router application. Server route pages parse URL/search filters and selectively fetch initial data; paged entity tables load data through Redux thunks. Client components handle interaction, forms, dialogs, tables, and local UI state. The UI uses React 19 and Material UI/MUI X 9.
- `apps/webapp/src/apiClient.ts` creates the shared `@budgetbuddyde/api` client using `NEXT_PUBLIC_BACKEND_SERVICE_HOST` (default `http://localhost:9000`). Browser-authenticated requests use `credentials: 'include'`.
- `packages/api` is the typed HTTP boundary. `BackendService` handles query serialization, delegates browser GET caching to `requestCache.ts`, invalidates cached responses after mutations, handles HTTP/JSON errors, and returns `TResult`; `EntityService` validates responses with Zod. Preserve `[data, null] | [null, error]` rather than introducing another error convention.
- `packages/db` contains Drizzle PostgreSQL tables, relations, enums, and views, with separate auth/domain schemas in the same database. Domain entities are owner-scoped through `ownerId`; join tables derive ownership from linked entities. Migration configuration and SQL live in `packages/db/drizzle.config.ts` and `packages/db/drizzle`.
- `services/backend` provides Better Auth under `/api/auth/*` and the Express/Drizzle domain API: request context and authentication middleware run before `/api/*` routers, which validate with Zod, enforce ownership, and return standardized `ApiResponse` values.
- Backend batch and relational writes use transactions and ownership checks; dedicated CRUD `/batch` operations are limited to 100 records (not application imports or merge arrays). Cache lookup/invalidation is part of the backend request pipeline. Shared domain mutations also invalidate caches; preserve the `sendDomainResponse` mechanism that avoids duplicate middleware invalidation.
- The backend exposes API-key-authenticated MCP tools at `/mcp`, using shared internal domain services with the REST API rather than HTTP loopback calls. Preserve all existing tool names, schemas, and responses; verify the current set in `services/backend/src/mcp/tools/index.ts` instead of relying on a hard-coded tool count.
- Frontend domain mutations refresh Redux entity state; component-only dialog/batch state stays local. Better Auth uses the existing `authClient.ts`, its own `{data, error}` results, and local API-key table state rather than domain Redux slices. Use `Promise.all` for independent lookups and Snackbar retry flows for surfaced request failures.
- Application data export/import uses `backend.application`: exports are uncached ZIP downloads with CSV/JSON resources; imports upload multipart archives in `preview` or `commit` mode and return per-resource results. Auth data and attachments are not imported. Refresh affected entity slices after import commits.
- The global Command Palette and intent-based navigation share entity actions. Consume intents once and remove only intent query parameters, including on failure; preserve unrelated filters.

## Key Directories

- `apps/webapp/src/app`: App Router routes, layouts, loading/error boundaries.
- `apps/webapp/src/components`: reusable domain UI, grouped by areas such as `Transaction`, `Budget`, `Table`, and `User`.
- `apps/webapp/src/lib`: frontend utilities and intent-based navigation.
- `packages/api/src`: typed API facade, backend/entity services, API schemas.
- `packages/db/src`: Drizzle schema and database exports; import through package boundaries.
- `packages/core`: shared configuration, environment access, and error primitives via public subpath exports.
- `packages/logger`: cross-cutting logging.
- `services/backend/src/domain`: owner-scoped domain services shared by REST and MCP.
- `services/backend/src/jobs`: scheduled recurring-payment processing.
- `services/backend/src/router`: authenticated, owner-scoped domain routers; authentication endpoints use the integrated Better Auth handler.
- `services/backend/src/middleware`: local Better Auth request context, cache, and related middleware.
- `services/backend/src/mcp`: stateless Streamable HTTP transport, tools, and local API-key authentication.
- `examples/api-key-client`: runnable API-key client example.
- `apps/documentation`: project and development documentation.

Workspaces are `packages/*`, `services/*`, `apps/webapp`, `apps/documentation`, and `examples/*`. Keep one root `package-lock.json`; do not add workspace-specific lockfiles.

## Development Commands

Run from the repository root unless using `--workspace`:

```bash
npm install
npm run build-packages   # build dependencies before apps/services when needed
npm run dev              # all development tasks through Turbo
npm run dev-services     # services only
npm run build            # all workspaces in dependency order
npm run build-services
npm run build-apps
npm run build-examples
npm run format:check
npm run lint:check
npm run typecheck
npm test
npm run ci               # format, lint, typecheck, test, build
```

For local services, use `docker compose up -d` for PostgreSQL, Redis, and the Drizzle gateway, then provide workspace `.env` files from the relevant `.env.example` files. Use `npm run check` for read-only formatting/lint checks and `npm run check:write` to apply fixes; run `npm run typecheck` separately. Documentation provides `format:check` and `typecheck`, but no `check`, lint, or test script. Run one workspace with `npm test --workspace <workspace-path>` or filter Turbo directly, for example `npx turbo run test --filter=@budgetbuddyde/api`.

## Code Conventions & Common Patterns

- Use strict TypeScript and the workspace `tsconfig`. Packages emit to `lib/`; services emit to `build/`; the webapp uses Next.js no-emit configuration.
- Use PascalCase for React components/classes and camelCase for functions/variables. Use `*.router.ts` for route modules and entity-oriented `Entity`, `Payload`, and `Response` names for schemas/types. Existing shared types commonly use `T`/`I` prefixes.
- In webapp code, use `@/*` for imports under `apps/webapp/src`; use `@budgetbuddyde/*` package imports across workspace boundaries. Do not reach into another package’s `src` internals.
- Validate API boundaries with Zod and safe parsing. Backend handlers require `req.context.user`, filter every entity query/write by the authenticated owner, and use `ApiResponse` builders.
- Keep domain API request results in the existing `TResult` tuple form. Better Auth's established client/result convention is separate; do not add ad-hoc clients, alternate domain response shapes, or parallel error handling.
- Recurring payments use date-only `startsOn`, persisted `paused` state, and shared UTC recurrence utilities in `packages/api/src/utils/recurrence.ts`. Preserve monthly anchor days when clamping occurrences to shorter months; use the existing occurrence and execution APIs rather than duplicating calendar logic.
- Use async service/route methods. Use Drizzle transactions for multi-step writes, explicit ownership checks for batch operations, and `Promise.all` only for independent work.
- Use Redux Toolkit selectors/actions for paged entity state; use local React state/reducers for component-only state. Keep forms validated with Zod and preserve intent-navigation idempotence/query parameters.
- Follow Prettier: 2 spaces, 120-column width, LF, single quotes, semicolons, trailing commas, `arrowParens: avoid`, `bracketSpacing: false`, and no JSX single quotes. ESLint import ordering and unused variables are warning-level; duplicate and unused imports are errors. Workspace lint scripts use `--max-warnings=0`, so warnings also fail validation.
- Prefer Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Do not commit secrets or generated output.

## Important Files

- `package.json`: workspace boundaries and root commands.
- `package-lock.json`: sole dependency lockfile.
- `turbo.json`: task dependencies, cache behavior, environment inputs, and outputs; builds use `dependsOn: ["^build"]`.
- `apps/webapp/src/apiClient.ts` and `apps/webapp/src/authClient.ts`: domain API and Better Auth client construction.
- `apps/webapp/src/proxy.ts`: Next.js auth redirects and route matcher; do not assume every dashboard route is covered.
- `apps/webapp/src/config.ts` and `services/backend/src/config.ts`: application configuration using shared core primitives.
- `packages/api/src/api.ts`: typed API facade.
- `packages/api/src/services/backend.service.ts`: shared request/error behavior.
- `packages/api/src/services/requestCache.ts`: browser-only 30-second successful-JSON GET cache and concurrent-request deduplication; preserve `no-store` and mutation invalidation semantics.
- `packages/api/src/services/entity.service.ts`: generic validated CRUD/batch behavior.
- `packages/api/src/types/schemas`: API Zod contracts.
- `packages/db/src/backend/tables.ts`: backend tables and ownership relationships.
- `services/backend/src/server.ts`: middleware, health routes, router composition, and global error handling.
- `services/backend/src/router/index.ts`: domain router mounts.
- `vitest.config.ts` and workspace `vitest.config.*`: shared and workspace test settings.
- `eslint.config.mjs`, `.prettierrc.json`, `.lintstagedrc.json`: quality tooling.
- `ci/general.pipeline.yml` and `ci/tasks/*.task.yml`: current Concourse main/PR verification and weekly dependency updates, using Node.js 24.21.0; `ci/database.pipeline.yml` handles database backups and migrations independently. See `ci/README.md`. The app pipeline does not version, tag, or publish packages/images.
- `.husky/pre-commit`: lint-staged and pre-commit checks.

## Runtime/Tooling Preferences

- Required baseline: Node.js 24.21.0 and npm 11.x (`packageManager: npm@11.4.2`). Use npm, not pnpm or yarn.
- Use Turborepo via `turbo run` and preserve its dependency graph; do not manually chain or bypass workspace build dependencies. `turbo.json` uses `^build`, Turbo cache outputs include `lib/**`, `build/**`, and `.next/**` (excluding Next cache and dev output), and environment mode is `loose`. Documentation overrides its build output to `dist/**` in `apps/documentation/turbo.json`.
- Use `npm ci` in CI and update dependencies with npm. When an internal package version changes, update consumers and refresh the root lockfile with `npm install --package-lock-only --ignore-scripts`.
- Use `tsx`/the existing service scripts for backend development and Next.js with Turbopack for webapp development. Do not introduce another package-resolution or API-client pattern.
- Local runtime dependencies are PostgreSQL, Redis, and the Drizzle gateway from `docker-compose.yml`. Keep secrets in ignored `.env` files.
- `startServer()` schedules recurring-payment processing in each backend process. Automatic bookings are deduplicated by owner, recurring-payment ID, scheduled date, and SHA-256 fingerprint of the deterministic UTF-8 JSON payment snapshot through `recurring_payment_execution`, atomically with the generated transaction. Changed payment content allows an additional full booking; reverting to any previously booked content is skipped. Legacy execution records without content block the whole occurrence. No distributed job lock is used. Execution records survive schedule/transaction deletion and are removed with the user; manual executions remain unprotected extra bookings. The job processes only today and does not catch up missed days. Old backend versions bypass this protection, so upgrades require a coordinated cutover.
- Attachment storage cleanup is request-scoped with retries, not a durable outbox. Database cascades alone do not remove storage objects; preserve explicit storage cleanup and cache invalidation when changing deletion flows.
- Documentation uses the `@budgetbuddyde/documentation` npm workspace and Fumapress/Fumadocs; content lives in `apps/documentation/docs`, with `press.config.tsx`, `source.config.ts`, and a static `dist/` build served by nginx in its Dockerfile. Follow the existing Waku override in the root/package manifests. Fumapress requires Node.js 24 or later.
- Optional OpenTelemetry instrumentation exists in the backend and webapp. Preserve the existing configuration and entry points (`OTEL_EXPORTER_OTLP_ENDPOINT` server-side, `NEXT_PUBLIC_OTEL_ENDPOINT` browser-side).

## Testing & QA

- Vitest is used across tested workspaces. Root defaults are global APIs, `silent: 'passed-only'`, Node environment, and exclusions for `build/**` and `node_modules/**`. Turbo tests depend on prerequisite builds and declare `coverage/**` as output.
- Webapp tests use Testing Library, `happy-dom`, `src/vitest.setup.ts`, React/tsconfig path plugins, and `vmThreads`. Next image/navigation APIs are globally mocked there; use `vi.mocked` when overriding mocks.
- Service tests are generally under `src/__tests__` and load `.env.test` where configured. Package tests are commonly colocated under `src`; webapp utilities use `.spec.ts` and component tests commonly use `.test.tsx`.
- Prefer deterministic inline fixtures and mocks (`vi.mock`, `vi.fn`, `vi.hoisted`), semantic Testing Library queries, interaction assertions, and `waitFor` for async UI behavior. Restore environment variables, spies, and mock state in `afterEach`.
- Test boundaries and observable behavior: Zod validation, query serialization, API error tuples, auth headers/context, owner isolation, transaction/error paths, cache hit/miss/invalidation, and UI state transitions. Do not test incidental implementation details.
- Backend tests collect coverage with 80% minimum thresholds for statements, branches, functions, and lines; other workspaces retain their existing coverage defaults. `packages/logger`, `packages/db`, and `packages/api` allow no-test passes where configured; do not infer coverage from that setting.
- Before submitting a permanent change, run the narrow workspace test, then relevant `npm run format:check`, `npm run lint:check`, `npm run typecheck`, and build. CI runs formatting, linting, typechecking, tests, then builds on Node 24.21.0.

## Integrated authentication

- Auth and domain data share the backend PostgreSQL connection and unchanged schemas. Preserve `AUTH_SECRET` and cookie settings during upgrades.
- Backend configuration requires `DATABASE_URL`, `AUTH_SECRET`, and `RESEND_API_KEY`; production also requires `BASE_URL` and `TRUSTED_ORIGINS`. `BASE_URL` must be an HTTP(S) origin without a path; development defaults to `http://localhost:<PORT>`. Browser auth uses `NEXT_PUBLIC_BACKEND_SERVICE_HOST`. Object storage configuration is loaded lazily but is also needed by transaction attachment previews.
- `AUTH_REDIS_URL` and `AUTH_REDIS_DB` (default `0`) configure auth sessions independently of response-cache Redis (`REDIS_URL`, `REDIS_DB` default `1`). Without auth Redis, sessions use PostgreSQL.
- Register `/api/auth/export` before Better Auth, and mount authentication before JSON parsing, domain session checks, and response caching. `/api/me` retains its domain `ApiResponse` contract.
- Auth endpoints must retain the raw request stream and bypass domain response caching. Keep the existing Better Auth integration and API-key plugin rather than introducing a separate auth service.

## Integrated MCP

- MCP runs at `<backend URL>/mcp`, with one server and transport per request and no session IDs. Preserve all registered tool names, schemas, and responses.
- REST and MCP share owner-scoped domain services and mutation cache invalidation. Pass the authenticated user explicitly; MCP must not call the REST API over HTTP.
- Authenticate each request locally using `x-api-key` or a Bearer API key; `x-api-key` takes precedence. Cookies alone do not authenticate MCP.
- Reject untrusted request origins with `403`; clients without an Origin header remain allowed. Use backend `TRUSTED_ORIGINS` for browser clients.
- In production, MCP has an independent 120 requests/minute/IP limit: it uses cache Redis when configured, otherwise an in-memory store. Configured Redis failures fail closed rather than switching to memory. Better Auth API-key quotas may also apply; domain HTTP limits do not apply to MCP.
- Close request transports after completion or client abort, and active MCP instances before shared resources during backend shutdown.
