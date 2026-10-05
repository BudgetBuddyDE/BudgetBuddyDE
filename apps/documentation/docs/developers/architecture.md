---
title: Architecture
description: How a request flows through the monorepo.
icon: Network
---

BudgetBuddyDE is a TypeScript npm-workspace monorepo orchestrated by Turborepo. Builds follow the dependency graph (`dependsOn: ["^build"]`); packages build before the services and apps that consume them.

## Request flow

```text
Browser
  │  fetch with credentials: 'include'
  ▼
Next.js web app (apps/webapp)
  │  server components prefetch via apiClient; client components fetch on interaction
  ▼
@budgetbuddyde/api
  │  BackendService: query serialization, GET cache, invalidation, TResult
  │  EntityService: Zod-validated CRUD and batch calls
  ▼
Backend (services/backend)
  │  CORS → log → auth endpoints or domain rate limit → local request context → cache → router
  ▼
Router (Zod validation)
  │  ownership filters on every query and write
  ▼
Drizzle → PostgreSQL
```

Supporting components:

- **Integrated Better Auth** handles authentication under `/api/auth/*` and validates domain request sessions in-process. Auth endpoints run before JSON parsing and domain authentication/cache middleware.
- **Redis** stores sessions (optional), cached responses, and rate-limit counters.
- **S3-compatible storage** holds attachment files.
- **Integrated MCP** exposes 28 tools at backend `/mcp`, authenticated locally with API keys. REST and MCP share internal domain services; there are no HTTP loopback calls.

## Error convention: `TResult`

API calls return a tuple, never throw for expected failures:

```ts
type TResult<T> = [T, null] | [null, Error];
```

Keep this shape when extending the API layer; do not introduce a second error convention. Components decide how to present failures, typically through Snackbar retry flows.

## Response format

Domain backend routes answer with an `ApiResponse` object. Better Auth endpoints retain their native response formats:

```json
{
  "status": 200,
  "message": "Fetched user's transactions successfully",
  "data": [],
  "totalCount": 0,
  "from": "db"
}
```

Validation failures are answered centrally with status 400, message `Validation Error`, and the Zod error details in `data`.

## Caching

There are two layers:

1. **Client-side GET cache** in `BackendService`, invalidated after mutations.
2. **Backend cache** in Redis, per route, with these TTLs:

| Route                   | TTL   |
| ----------------------- | ----- |
| `/api/category`         | 300 s |
| `/api/paymentMethod`    | 300 s |
| `/api/transaction`      | 60 s  |
| `/api/recurringPayment` | 300 s |
| `/api/budget`           | 300 s |
| `/api/insights`         | 120 s |

Only listed routes are cached. REST and MCP mutations invalidate affected owner-scoped keys through shared invalidation logic after successful writes. When Redis is not configured, the backend cache is disabled.

## Rate limiting

Production HTTP limits use Redis. Auth HTTP limits use `AUTH_REDIS_URL` when set, otherwise cache `REDIS_URL`; domain limits use `REDIS_URL`. MCP uses its own limiter with cache Redis or an in-memory fallback. The API-key plugin also enforces its configured limit:

| Service                    | Limit                |
| -------------------------- | -------------------- |
| Authentication             | 500 requests / 5 min |
| Backend                    | 300 requests / 5 min |
| Backend application export | 4 / 15 min           |
| Auth export                | 2 / 15 min           |
| MCP (`/mcp`)               | 120 / min / IP       |
| API keys                   | 250 requests / 5 min |

## Ownership and writes

- Every backend entity is owner-scoped through `ownerId`. REST handlers and MCP tools pass the authenticated user explicitly to shared domain services, which filter every query and write by it.
- Batch operations are limited to 100 records and verify ownership of every ID before writing.
- Multi-step and relational writes (batch create/update, category merge, import) run in Drizzle transactions.

## Frontend state

Paged entity lists live in Redux Toolkit slices (transactions, categories, payment methods, recurring payments, budgets). Component-only state such as open dialogs stays local. Server route pages parse URL and search filters, prefetch data, and pass it to client components.

## Next steps

- [Workspaces](/developers/workspaces)
- [Database](/developers/database)
- [Authentication](/developers/authentication)
- [API and MCP](/developers/api-and-mcp)
