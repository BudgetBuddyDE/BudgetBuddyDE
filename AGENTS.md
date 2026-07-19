# Repository Guidelines

## Project Overview

BudgetBuddyDE is an open-source personal-finance manager. It provides a Next.js web application for transactions, recurring payments, budgets, analytics, categories, and payment methods, backed by typed internal packages and Express services.

The repository is an npm-workspace monorepo orchestrated by Turborepo.

## Architecture & Data Flow

- `apps/webapp` is a Next.js 15 App Router frontend using React, MUI, Redux Toolkit, Zustand, React Hook Form, and Zod.
- Web routes parse URL/search filters in server pages, then compose client components. Example: `apps/webapp/src/app/(dashboard)/transactions/page.tsx` renders `TransactionTable` inside loading/error boundaries.
- `apps/webapp/src/apiClient.ts` creates the shared `@budgetbuddyde/api` client from `NEXT_PUBLIC_BACKEND_SERVICE_HOST` (default `http://localhost:9000`).
- `packages/api` exposes typed services for backend entities. `EntityService`/`BackendService` perform requests, cache handling, HTTP/JSON checks, Zod response validation, and return `TResult` tuples: `[data, null]` or `[null, error]`.
- `services/backend` is an Express API using Drizzle, PostgreSQL, Redis, Zod validation, authentication context, rate limiting, logging, cache invalidation, and S3 attachment handling. Routers are mounted under `/api/*` in `services/backend/src/server.ts`.
- Backend routers validate request payloads, require `req.context.user`, filter records by `ownerId`, use `ApiResponse`, and use database transactions for batch/relational updates.
- Frontend mutations dispatch Redux refresh actions; request failures are surfaced through Snackbar retry flows. Related value-help requests are commonly loaded with `Promise.all`.

## Key Directories

- `apps/webapp/src/app`: Next App Router pages, layouts, and route-level error boundaries.
- `apps/webapp/src/components`: reusable UI grouped by domain (`Transaction`, `Budget`, `Table`, `User`, etc.).
- `apps/webapp/src/lib`: frontend utilities and intent-based navigation.
- `packages/api`: typed HTTP client, entity services, and Zod API schemas.
- `packages/db`: Drizzle database schema/configuration.
- `packages/types`: shared TypeScript types and schemas.
- `packages/utils`: shared utilities and decorators.
- `packages/logger`: shared logger package; documentation marks it deprecated.
- `services/backend`: primary API service and routers.
- `services/auth-service`: authentication service.
- `services/mcp`: MCP service and request authentication.
- `examples/api-key-client`: runnable API-key client example.
- `apps/documentation`: project documentation source.

Workspaces are declared in `package.json`: `packages/*`, `services/*`, `apps/webapp`, and `examples/*`. Keep one root `package-lock.json`; do not add workspace-specific lockfiles.

## Development Commands

Run from the repository root unless using `--workspace`:

```bash
npm install
npm run build-packages   # required before dependent apps/services when starting fresh
npm run dev              # all development tasks through Turbo
npm run dev-services     # services only
npm run build            # all workspaces in dependency order
npm run build-services
npm run build-apps
npm run build-examples
npm run typecheck
npm run format:check
npm run lint:check
npm test
npm run ci               # format, lint, typecheck, test, build
```

Local service development normally requires `docker compose up -d` and workspace `.env` files. The compose stack provides PostgreSQL on `5432`, Redis on `6379`, and the Drizzle gateway on `4983`. Use `npm run check` for formatting, linting, and type checks; `npm run check:write` applies formatting/lint fixes.

Run a single workspace with `npm test --workspace <workspace-path>` or use Turbo filtering, for example `npm test -- --filter=@budgetbuddyde/api`.

## Code Conventions & Common Patterns

- TypeScript is strict. Match each workspace’s existing `tsconfig`; packages compile to `lib/`, services to `build/`, and the webapp uses Next’s no-emit configuration.
- Use PascalCase for React components/classes and camelCase for functions/variables. Route modules use `*.router.ts`; schemas use entity-oriented `Entity`, `Payload`, and `Response` names. Existing shared types commonly use `T`/`I` prefixes.
- In webapp code, use `@/*` for imports under `apps/webapp/src`; use workspace package names for cross-workspace imports such as `@budgetbuddyde/api` and `@budgetbuddyde/types`.
- Prefer Zod schemas at API boundaries and safe parsing before exposing response data. Preserve the `TResult` tuple error contract in API services.
- Backend handlers authenticate through request context, enforce owner-scoped queries, return standardized `ApiResponse` values, and use Drizzle transactions for multi-step writes.
- Preserve existing async patterns: `async` route/service methods, `Promise.all` for independent lookups, and `fetch(..., {credentials: 'include'})` for browser-authenticated API calls.
- Use Redux Toolkit selectors/actions for paged entity state and local reducers/state for component-only dialogs and batch UI state. Keep form data validated with Zod.
- Follow Prettier: 2 spaces, 120-column print width, LF, single quotes, semicolons, trailing commas, no spaces inside braces, and `arrowParens: avoid`. ESLint import ordering is warning-level; duplicate imports and unused imports are errors.
- Do not introduce a second error/response convention, ad-hoc API client, or alternate workspace package-resolution pattern.

## Important Files

- `package.json`: npm version, workspace boundaries, and root commands.
- `package-lock.json`: sole lockfile.
- `turbo.json`: task dependencies, caching, environment inputs, and build outputs.
- `apps/webapp/src/apiClient.ts`: frontend API client construction.
- `packages/api/src/api.ts`: typed API facade.
- `packages/api/src/services/backend.service.ts`: shared request/error/cache behavior.
- `packages/api/src/services/entity.service.ts`: generic validated CRUD/batch behavior.
- `packages/api/src/types/schemas`: API Zod contracts.
- `services/backend/src/server.ts`: Express middleware and router composition.
- `services/backend/src/router`: authenticated, owner-scoped API routes.
- `vitest.config.ts` and workspace `vitest.config.*`: test defaults and workspace overrides.
- `eslint.config.mjs`, `.prettierrc.json`, `.lintstagedrc.json`: quality and pre-commit tooling.
- `.github/workflows/ci.yml`: CI quality gates and filtered builds.
- `.husky/pre-commit`: lint-staged plus Turbo typecheck before commits.

## Runtime/Tooling Preferences

- Required baseline: Node.js 22+ and npm 11.x (`packageManager: npm@11.4.2`). Use npm, not pnpm/yarn, for workspace installation and lockfile updates.
- Use Turborepo through the existing npm scripts. `turbo.json` builds dependencies first via `dependsOn: ["^build"]`; avoid bypassing that order for workspace builds.
- TypeScript is the implementation language. Use `tsx` for backend development watch mode and Next’s `--turbopack` development mode for the webapp.
- Environment mode is Turbo `loose`; `.env*` files affect builds. Never commit secrets. Service tests load `.env.test` where configured.
- Internal dependencies use local package versions rather than `workspace:*`. If an internal package version changes, update consumers and refresh the lockfile with `npm install --package-lock-only --ignore-scripts`.

## Testing & QA

- Vitest is used across tested workspaces. Root defaults are global APIs, Node environment, passed-only output, and exclusions for `build/**` and `node_modules/**`.
- Webapp tests use Testing Library, `happy-dom`, `src/vitest.setup.ts`, React/Vite path plugins, and `vmThreads`. Next image/navigation APIs are globally mocked; use `vi.mocked` when overriding those mocks.
- Service tests are generally under `src/__tests__`, load `.env.test`, and cover validation, auth context, ownership/transactions, and error paths. Package tests are usually colocated under `src`; webapp component and hook tests are colocated with source.
- Prefer deterministic fixtures and cleanup: restore `process.env`, `vi.spyOn`/stubbed globals, and mock state in `afterEach`.
- Test behavior at boundaries: Zod validation, query serialization, API error tuples, auth headers/context, transaction rollback, and UI state transitions. Do not test incidental implementation details.
- Coverage is disabled by default and no threshold is enforced. `db` and `logger` permit no-test passes; do not infer coverage from the descriptive documentation inventory.
- Before submitting a change, run the narrow workspace test first, then the relevant `npm run format:check`, `npm run lint:check`, `npm run typecheck`, and build. The CI-equivalent sequence is documented in `apps/documentation/docs/development/start-development.md` and `.github/workflows/ci.yml`.
