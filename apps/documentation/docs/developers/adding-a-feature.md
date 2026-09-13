---
title: Adding a feature
description: End-to-end recipe from database table to UI.
icon: Puzzle
---

This checklist follows the flow of a domain feature through the monorepo. The category merge endpoint and transaction list are good reference implementations.

## 1. Database

1. Add or change tables in `packages/db/src/backend/tables.ts`, enums in `src/backend/enums.ts`, and relations/views where needed.
2. Keep the ownership rule: every entity references the Better Auth user and the backend filters by `ownerId`.
3. Generate and apply a migration:

```bash
npm run db:generate --workspace @budgetbuddyde/db
npm run db:migrate --workspace @budgetbuddyde/db
```

## 2. Contracts

1. Add Zod schemas under `packages/api/src/types/schemas` (entity, payload, response shapes).
2. Extend the typed client in `packages/api/src` so the web app and external clients share one contract.
3. Keep `TResult` as the error convention.

## 3. Backend

1. Add or extend a `*.router.ts` in `services/backend/src/router` and export it from `router/index.ts`.
2. Order middleware correctly: the server mounts context, auth, cache, logging, and validation before your handler.
3. In each handler:
   - Read `req.context.user`; return 401 when missing.
   - Filter every query and write by `ownerId`.
   - Validate with Zod via `validateRequest`.
   - Answer with `ApiResponse` builders.
   - Use Drizzle transactions for multi-step writes; reuse `batch.ts` helpers for batch operations (100-record limit).
4. If the route is cacheable, add it to the cache route list in `services/backend/src/config.ts`; mutations must invalidate affected keys.

## 4. Web app

1. Add a Redux slice under `apps/webapp/src/lib/features` for paged entity state, or local state for component-only concerns.
2. Use the shared `apiClient` from `apps/webapp/src/apiClient.ts`; do not create ad-hoc fetch calls.
3. Add UI under `apps/webapp/src/components` following the existing patterns (dialogs, tables, filter, snackbar retries). Server route pages prefetch; client components mutate and refresh Redux state.
4. Keep forms validated with Zod and preserve intent-based navigation and query parameters.

## 5. Tests

- Backend: validation, owner isolation, transaction and error paths in `services/backend/src/__tests__`.
- API package: query serialization and `TResult` behavior.
- Web app: component behavior with Testing Library and semantic queries.

Run the narrow test first, then the full checks:

```bash
npm test --workspace @budgetbuddyde/backend
npm run check
npm run typecheck
```

## 6. Documentation

- User-facing behavior goes into the [user guide](/users/getting-started).
- Configuration or deployment impact goes into [Configuration](/self-hosting/configuration).
- Architectural changes go into [Architecture](/developers/architecture) or [Workspaces](/developers/workspaces).

## Next steps

- [Getting started](/developers/getting-started)
- [Architecture](/developers/architecture)
