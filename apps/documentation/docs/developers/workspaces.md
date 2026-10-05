---
title: Workspaces
description: What each package, service, and app is responsible for.
icon: Boxes
---

The monorepo contains packages (`packages/*`), services (`services/*`), apps (`apps/webapp`, `apps/documentation`), and examples (`examples/*`). Packages emit to `lib/`, services to `build/`, and the web app to `.next/`.

## Applications

### `apps/webapp` - Next.js frontend

Next.js 15 App Router application. Server route pages parse URL/search filters and prefetch data; client components handle interaction, forms, dialogs, tables, and local UI state.

- `src/apiClient.ts` - constructs the shared `@budgetbuddyde/api` client from `NEXT_PUBLIC_BACKEND_SERVICE_HOST` (default `http://localhost:9000`) with `credentials: 'include'`.
- `src/app` - route groups `(auth)` and `(dashboard)` plus internal Next routes under `api/`.
- `src/components` - domain UI grouped by area (Transaction, Budget, Category, Charts, User, and so on).
- `src/lib/features` - Redux Toolkit slices for paged entity state.
- `src/instrumentation.ts` / `src/instrumentation-client.ts` - OpenTelemetry setup; server-side registers when `OTEL_EXPORTER_OTLP_ENDPOINT` is set, client-side when `NEXT_PUBLIC_OTEL_ENDPOINT` is set (see [Configuration](/self-hosting/configuration#tracing-opentelemetry)).

### `apps/documentation` - this site

Fumapress (Fumadocs) site served at [docs.budget-buddy.de](https://docs.budget-buddy.de). Content lives in `docs/`, navigation in `meta.json` files per folder. The workspace uses the repository-wide Node.js 24.21.0 LTS baseline.

## Services

### `services/backend` - domain API, authentication, and MCP

Express API under `/api/*`. Routers validate with Zod, enforce ownership, and answer with `ApiResponse` values. Also hosts Better Auth under `/api/auth/*`, authentication emails, OAuth, API keys, the daily recurring-payment job, and import/export endpoints. `src/auth.ts` configures Better Auth with the shared Drizzle PostgreSQL connection. MCP runs in this process at `/mcp` and shares internal domain services with REST, preserving the 28 tool contracts.

- `src/server.ts` - middleware order, route mounts, cron schedule.
- `src/router/index.ts` - domain router exports; each `*.router.ts` is one domain.
- `src/middleware` - request context, auth, cache, logging.
- `src/lib` - S3 client, attachment handler, logger.
- `src/mcp` - stateless Streamable HTTP transport, tools, and local API-key authentication.
- `src/tracer.ts` / `src/instrumentation.ts` - OpenTelemetry setup, loaded via `npm run start:instrumentation`.

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
