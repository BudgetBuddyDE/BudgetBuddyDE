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

1. **Browser GET cache** in `BackendService`, limited to successful JSON responses for the confirmed user session. It uses a 30-second TTL, deduplicates concurrent requests, and advances a generation when cleared so an older in-flight response cannot repopulate the cache. Requests without a session scope, with explicit authorization headers, or with `cache: 'no-store'` bypass it.
2. **Backend cache** in Redis, per route, with these TTLs:

| Route                   | TTL   |
| ----------------------- | ----- |
| `/api/category`         | 300 s |
| `/api/paymentMethod`    | 300 s |
| `/api/transaction`      | 60 s  |
| `/api/recurringPayment` | 300 s |
| `/api/budget`           | 300 s |
| `/api/insights`         | 120 s |

Only listed routes are cached. Redis keys include the authenticated owner, route, full query, and generation. REST and MCP mutations invalidate affected owner-scoped keys through shared invalidation logic. Auth endpoints and archive import/export paths remain outside this cache. Domain API responses carry `Cache-Control: private, no-store` for browsers and intermediary proxies; the backend's owner-scoped Redis cache remains an explicit internal cache. When Redis is not configured, the backend cache is disabled.

Next.js must not cache private financial API responses in a shared data or route cache. Server components that fetch private API data must explicitly use `cache: 'no-store'` and forward the current request's authentication headers. Cache only public, user-independent data with Next.js.

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

Paged entity lists live in Redux Toolkit slices (transactions, categories, payment methods, recurring payments, budgets). Insights keeps its report results locally; dialogs and in-progress form input also stay local. Better Auth keeps its own `{data, error}` contract, while domain API calls preserve `[data, null] | [null, error]`.

The URL is the source of truth for committed filters, date ranges, and pagination. Pages use one-based `page` values; Redux and MUI use zero-based page indexes. Entity pages default to 15 rows, and Insights defaults to 10. Invalid values fall back to defaults. User changes push history entries; initial normalization and intent cleanup replace the current entry. Query updates retain unrelated parameters and fragments. Back/forward navigation restores controls and refetches the matching data.

For each request, show a loading state until its result arrives. A result for an older request must not replace a newer query. Empty states are shown only after a successful empty response. Query failures offer a retry for the current URL; mutation failures continue using the existing Snackbar retry flow, and mutations are not retried automatically. Successful mutations invalidate the relevant cache entries and refresh the active view plus dependent summaries.

### Migration checklist

1. Keep the cache and request-generation guarantees above in place before migrating a page.
2. Add one typed parser/serializer pair for the page's supported filters and pagination; preserve existing parameter names and unrelated query parameters.
3. Parse the same URL state on the server page and client view. Keep paged entity results in Redux and transient UI state local.
4. Make URL changes the sole trigger for fetching committed query state, and verify direct links, reload, and back/forward navigation.
5. Verify loading, empty, error, retry, mutation invalidation, and owner-scoped caching for the page and its dependent data.

The reference route is Transactions. Migrate Categories and Payment Methods, Recurring Payments, the Budget list, then Insights. Dashboard summaries, standalone attachments, and recurring-payment occurrences remain follow-up areas; inventory their queries, URL parameters, and cache behavior before migrating them.

## Next steps

- [Workspaces](/developers/workspaces)
- [Database](/developers/database)
- [Authentication](/developers/authentication)
- [API and MCP](/developers/api-and-mcp)
