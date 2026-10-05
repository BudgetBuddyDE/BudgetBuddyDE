# Repository Guidelines

## Project Overview

BudgetBuddyDE is an open-source personal-finance manager for transactions, recurring payments, budgets, analytics, categories, payment methods, attachments, and insights. It is a strict TypeScript npm-workspace monorepo orchestrated by Turborepo, with a Next.js frontend and authenticated backend services.

## Architecture & Data Flow

- `apps/webapp` is a Next.js 15 App Router application. Server route pages parse URL/search filters and prefetch data; client components handle interaction, forms, dialogs, tables, and local UI state.
- `apps/webapp/src/apiClient.ts` creates the shared `@budgetbuddyde/api` client using `NEXT_PUBLIC_BACKEND_SERVICE_HOST` (default `http://localhost:9000`). Browser-authenticated requests use `credentials: 'include'`.
- `packages/api` is the typed HTTP boundary. `BackendService` handles query serialization, GET caching, cache invalidation after mutations, HTTP/JSON errors, and `TResult`; `EntityService` validates responses with Zod. Preserve `[data, null] | [null, error]` rather than introducing another error convention.
- `packages/db` contains Drizzle PostgreSQL tables, relations, enums, and views. Backend entities are owner-scoped through `ownerId`.
- `services/backend` provides Better Auth under `/api/auth/*` and the Express/Drizzle domain API: request context and authentication middleware run before `/api/*` routers, which validate with Zod, enforce ownership, and return standardized `ApiResponse` values.
- Backend batch and relational writes use transactions and ownership checks; batch operations are limited to 100 records. Cache lookup/invalidation is part of the backend request pipeline.
- The backend exposes 28 API-key-authenticated MCP tools at `/mcp`, using shared internal domain services with the REST API rather than HTTP loopback calls.
- Frontend mutations refresh Redux entity state; component-only dialog/batch state stays local. Use `Promise.all` for independent lookups and Snackbar retry flows for surfaced request failures.

## Key Directories

- `apps/webapp/src/app`: App Router routes, layouts, loading/error boundaries.
- `apps/webapp/src/components`: reusable domain UI, grouped by areas such as `Transaction`, `Budget`, `Table`, and `User`.
- `apps/webapp/src/lib`: frontend utilities and intent-based navigation.
- `packages/api/src`: typed API facade, backend/entity services, API schemas.
- `packages/db/src`: Drizzle schema and database exports; import through package boundaries.
- `packages/logger`: cross-cutting logging.
- `services/backend/src/router`: authenticated, owner-scoped domain routers; authentication endpoints use the integrated Better Auth handler.
- `services/backend/src/middleware`: local Better Auth request context, cache, and related middleware.
- `services/backend/src/mcp`: stateless Streamable HTTP transport, tools, and local API-key authentication.
- `examples/api-key-client`: runnable API-key client example.
- `apps/documentation`: project and development documentation.

Workspaces are `packages/*`, `services/*`, `apps/webapp`, and `examples/*`. Keep one root `package-lock.json`; do not add workspace-specific lockfiles.

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

For local services, use `docker compose up -d` for PostgreSQL, Redis, and the Drizzle gateway, then provide workspace `.env` files from the relevant `.env.example` files. Use `npm run check` for read-only formatting/lint/type checks and `npm run check:write` to apply fixes. Run one workspace with `npm test --workspace <workspace-path>` or filter Turbo directly, for example `npx turbo run test --filter=@budgetbuddyde/api`.

## Code Conventions & Common Patterns

- Use strict TypeScript and the workspace `tsconfig`. Packages emit to `lib/`; services emit to `build/`; the webapp uses Next.js no-emit configuration.
- Use PascalCase for React components/classes and camelCase for functions/variables. Use `*.router.ts` for route modules and entity-oriented `Entity`, `Payload`, and `Response` names for schemas/types. Existing shared types commonly use `T`/`I` prefixes.
- In webapp code, use `@/*` for imports under `apps/webapp/src`; use `@budgetbuddyde/*` package imports across workspace boundaries. Do not reach into another package’s `src` internals.
- Validate API boundaries with Zod and safe parsing. Backend handlers require `req.context.user`, filter every entity query/write by the authenticated owner, and use `ApiResponse` builders.
- Keep API request results in the existing `TResult` tuple form. Do not add ad-hoc clients, alternate response shapes, or parallel error handling.
- Use async service/route methods. Use Drizzle transactions for multi-step writes, explicit ownership checks for batch operations, and `Promise.all` only for independent work.
- Use Redux Toolkit selectors/actions for paged entity state; use local React state/reducers for component-only state. Keep forms validated with Zod and preserve intent-navigation idempotence/query parameters.
- Follow Prettier: 2 spaces, 120-column width, LF, single quotes, semicolons, trailing commas, `arrowParens: avoid`, and no JSX single quotes. ESLint import ordering is warning-level; duplicate and unused imports are errors.
- Prefer Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Do not commit secrets or generated output.

## Important Files

- `package.json`: workspace boundaries and root commands.
- `package-lock.json`: sole dependency lockfile.
- `turbo.json`: task dependencies, cache behavior, environment inputs, and outputs; builds use `dependsOn: ["^build"]`.
- `apps/webapp/src/apiClient.ts`: frontend API client construction.
- `packages/api/src/api.ts`: typed API facade.
- `packages/api/src/services/backend.service.ts`: shared request/cache/error behavior.
- `packages/api/src/services/entity.service.ts`: generic validated CRUD/batch behavior.
- `packages/api/src/types/schemas`: API Zod contracts.
- `packages/db/src/backend/tables.ts`: backend tables and ownership relationships.
- `services/backend/src/server.ts`: middleware, health routes, router composition, and global error handling.
- `services/backend/src/router/index.ts`: domain router mounts.
- `vitest.config.ts` and workspace `vitest.config.*`: shared and workspace test settings.
- `eslint.config.mjs`, `.prettierrc.json`, `.lintstagedrc.json`: quality tooling.
- `ci/pipelines/*.pipeline.yml`: Concourse CI pipelines use the pinned Node.js 24.21.0 LTS image.
- `.husky/pre-commit`: lint-staged and pre-commit checks.

## Runtime/Tooling Preferences

- Required baseline: Node.js 24.21.0 and npm 11.x (`packageManager: npm@11.4.2`). Use npm, not pnpm or yarn.
- Use Turborepo via `turbo run` and preserve its dependency graph; do not manually chain or bypass workspace build dependencies. `turbo.json` uses `^build`, Turbo cache outputs include `lib/**`, `build/**`, and `.next/**` (excluding Next cache), and environment mode is `loose`.
- Use `npm ci` in CI and update dependencies with npm. When an internal package version changes, update consumers and refresh the root lockfile with `npm install --package-lock-only --ignore-scripts`.
- Use `tsx`/the existing service scripts for backend development and Next.js with Turbopack for webapp development. Do not introduce another package-resolution or API-client pattern.
- Local runtime dependencies are PostgreSQL, Redis, and the Drizzle gateway from `docker-compose.yml`. Keep secrets in ignored `.env` files.
- Documentation uses the `@budgetbuddyde/documentation` npm workspace and Fumapress; follow its `package.json`, configuration, and Dockerfile. Fumapress currently requires Node.js 24 or later.

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
- `BASE_URL` is the complete public backend URL, required in production; development defaults to `http://localhost:<PORT>`. Browser auth uses `NEXT_PUBLIC_BACKEND_SERVICE_HOST`.
- `AUTH_REDIS_URL` and `AUTH_REDIS_DB` (default `0`) configure auth sessions independently of response-cache Redis (`REDIS_URL`, `REDIS_DB` default `1`). Without auth Redis, sessions use PostgreSQL.
- Register `/api/auth/export` before Better Auth, and mount authentication before JSON parsing, domain session checks, and response caching. `/api/me` retains its domain `ApiResponse` contract.
- Backend coverage requires at least 80% for statements, branches, functions, and lines. Use deterministic unit tests with mocked external dependencies.

## Integrated MCP

- MCP runs at `<backend URL>/mcp`, with one server and transport per request and no session IDs. Preserve all 28 tool names, schemas, and responses.
- REST and MCP share owner-scoped domain services and mutation cache invalidation. Pass the authenticated user explicitly; MCP must not call the REST API over HTTP.
- Authenticate each request locally using `x-api-key` or a Bearer API key; `x-api-key` takes precedence. Cookies alone do not authenticate MCP.
- Reject untrusted request origins with `403`; clients without an Origin header remain allowed. Use backend `TRUSTED_ORIGINS` for browser clients.
- In production, MCP has an independent 120 requests/minute/IP limit using cache Redis when available, with an in-memory fallback. Domain HTTP limits do not apply to MCP.
- Close request transports after completion or client abort, and active MCP instances before shared resources during backend shutdown.
