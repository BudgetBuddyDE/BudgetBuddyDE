---
title: Workspaces
description: What each package, service, and app is responsible for.
icon: Boxes
---

The monorepo contains packages (`packages/*`), services (`services/*`), apps (`apps/webapp`, `apps/documentation`), and examples (`examples/*`). Packages emit to `lib/`, services to `build/`, and the web app to `.next/`.

## Applications

### `apps/webapp` — Next.js frontend

Next.js 15 App Router application. Server route pages parse URL/search filters and prefetch data; client components handle interaction, forms, dialogs, tables, and local UI state.

- `src/apiClient.ts` — constructs the shared `@budgetbuddyde/api` client from `NEXT_PUBLIC_BACKEND_SERVICE_HOST` (default `http://localhost:9000`) with `credentials: 'include'`.
- `src/app` — route groups `(auth)` and `(dashboard)` plus internal Next routes under `api/`.
- `src/components` — domain UI grouped by area (Transaction, Budget, Category, Charts, User, and so on).
- `src/lib/features` — Redux Toolkit slices for paged entity state.

### `apps/documentation` — this site

Fumapress (Fumadocs) site served at [docs.budget-buddy.de](https://docs.budget-buddy.de). Content lives in `docs/`, navigation in `meta.json` files per folder. Note: the docs workspace requires Node.js 24 or later, unlike the rest of the repository.

## Services

### `services/auth-service` — authentication

Express service with Better Auth on a Drizzle/pg adapter. Registration, login, sessions, email verification, password reset, email change, account deletion, social providers, and API keys. Entry points: `src/auth.ts` (Better Auth configuration), `src/config.ts`, `src/db/`.

### `services/backend` — domain API

Express API under `/api/*`. Routers validate with Zod, enforce ownership, and answer with `ApiResponse` values. Also hosts the daily recurring-payment job and the import/export endpoints.

- `src/server.ts` — middleware order, route mounts, cron schedule.
- `src/router/index.ts` — domain router exports; each `*.router.ts` is one domain.
- `src/middleware` — request context, auth, cache, logging.
- `src/lib` — S3 client, attachment handler, logger.
- `src/tracer.ts` / `src/instrumentation.ts` — OpenTelemetry setup, loaded via `npm run start:instrumentation`.

### `services/mcp` — MCP server

Express + MCP SDK service exposing backend capabilities as tools for LLM clients. Stateless Streamable HTTP transport at `/mcp`; one transport per request. Entry points: `src/server.ts`, `src/tools/index.ts`, `src/middleware/apiKey.middleware.ts`, `src/tracer.ts`/`src/instrumentation.ts` (OpenTelemetry setup, loaded via `npm run start:instrumentation`).

## Packages

| Package           | Purpose                                                                                                                                              | Entry points                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `packages/api`    | Typed HTTP boundary: query serialization, GET caching, cache invalidation, HTTP/JSON errors, `TResult`; `EntityService` validates responses with Zod | `src/api.ts`, `src/services/backend.service.ts`, `src/services/entity.service.ts`, `src/types/schemas` |
| `packages/db`     | Drizzle PostgreSQL schema: Better Auth tables (`src/auth`), backend tables, relations, enums, views (`src/backend`)                                  | `src/backend/tables.ts`, `src/backend/enums.ts`, exports `@budgetbuddyde/db/backend` and `/auth`       |
| `packages/core`   | Shared `BackendConfig` base class, environment parsing, `EnvironmentNotSetError`; used by all services                                               | `src/config/BackendConfig.ts`, `src/error/`                                                            |
| `packages/logger` | Cross-cutting structured logging facade                                                                                                              | `src/`                                                                                                 |

## Examples

### `examples/api-key-client`

Runnable Node/TypeScript example that authenticates against the backend with a user API key (`x-api-key`) through `@budgetbuddyde/api` and prints recent transactions and recurring payments. See [API keys and MCP](/users/api-keys).

## Import boundaries

Use `@budgetbuddyde/*` imports across workspace boundaries and never reach into another workspace's `src` internals. Inside the web app, use the `@/*` alias for `apps/webapp/src`.

## Next steps

- [Database](/developers/database)
- [Adding a feature](/developers/adding-a-feature)
