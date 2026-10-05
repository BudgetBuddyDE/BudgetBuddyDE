---
title: API and MCP
description: REST surface, response format, and the MCP service.
icon: Cable
---

The backend exposes a REST API under `/api/*`; the MCP service wraps it for LLM clients. Domain routes are owner-scoped and validate input with Zod. Better Auth uses its own endpoint contracts under `/api/auth/*`.

## REST endpoints

| Base path               | Domain                                               |
| ----------------------- | ---------------------------------------------------- |
| `/api/category`         | CRUD, batch create/update, merge, per-category stats |
| `/api/paymentMethod`    | CRUD and batch operations                            |
| `/api/transaction`      | CRUD, batch operations, filters                      |
| `/api/recurringPayment` | CRUD, batch operations, occurrences                  |
| `/api/budget`           | CRUD and `/estimated` (current-month free amount)    |
| `/api/insights`         | Aggregated analytics                                 |
| `/api/attachment`       | Fetch with signed URL, delete                        |
| `/api/application`      | Export and import (`/export`, `/import`)             |
| `/api/auth/*`           | Better Auth registration, sessions, OAuth, API keys  |
| `/api/auth/export`      | Auth metadata ZIP export (`format=json` or `csv`)    |
| `/api/me`               | Current request context                              |
| `/health`               | Health                                               |

Common list query parameters are `from`/`to` for offset/limit pagination and `search` for text search. Responses include `totalCount` where applicable.

## Response format

Domain routes answer with `ApiResponse`; `/api/me` keeps this contract. Better Auth returns its native responses, and auth export returns a ZIP archive:

```json
{
  "status": 200,
  "message": "Fetched user's transactions successfully",
  "data": [],
  "totalCount": 12,
  "from": "db"
}
```

- `status` mirrors the HTTP status code.
- Validation errors return HTTP 400 with message `Validation Error` and the Zod issues in `data`.
- Errors carry a human-readable `message`; clients surface it directly.

## Authentication

- **Session cookie** - browsers send cookies with `credentials: 'include'`; the backend validates them using its local Better Auth instance.
- **API key** - external clients send `x-api-key: bb-...`. The same key works against the MCP service.

## Typed client

`packages/api` is the typed boundary:

- `BackendService` handles query serialization, GET caching, cache invalidation after mutations, HTTP/JSON errors, and returns `TResult`.
- `EntityService` validates responses with Zod and implements generic CRUD and batch behavior.
- Per-domain services and Zod schemas live next to the client so the web app and external tools share the same contracts.

`new Api(backendHost, logger?)` uses one backend URL for all services, including `api.auth.dataExport` at `/api/auth/export`. The previous separate auth-host constructor argument has been removed.

See the runnable [`examples/api-key-client`](https://github.com/BudgetBuddyDE/BudgetBuddyDE/tree/main/examples/api-key-client) for API-key usage.

## MCP service

`services/mcp` exposes BudgetBuddy as MCP tools:

- **Endpoint:** `POST/GET/DELETE /mcp` (default port 8070).
- **Transport:** stateless Streamable HTTP; each request gets its own server and transport, so there are no session IDs.
- **Auth:** `x-api-key` or `Authorization: Bearer` validated by the API-key middleware.
- **Tools:** categories, payment methods, transactions, recurring payments, budgets, and attachments (`src/tools/index.ts`).
- **Health:** `/health` proxy the backend health.
- **Rate limit:** 120 requests per minute when `NODE_ENV=production`.

The service forwards the caller's API key to the backend, so all tool actions run with the key owner's permissions and data.

## Next steps

- [Adding a feature](/developers/adding-a-feature)
- [API keys and MCP (user guide)](/users/api-keys)
