---
title: API and MCP
description: REST contracts and integrated backend MCP tools.
icon: Cable
---

The backend exposes a REST API under `/api/*` and MCP tools under `/mcp`. Both call shared internal domain services; MCP does not call REST over HTTP. Domain routes are owner-scoped and validate input with Zod. Better Auth uses its own endpoint contracts under `/api/auth/*`.

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
- **API key** - external clients send `x-api-key: bb-...`. The same key works against backend `/mcp`.

## Typed client

`packages/api` is the typed boundary:

- `BackendService` handles query serialization, GET caching, cache invalidation after mutations, HTTP/JSON errors, and returns `TResult`.
- `EntityService` validates responses with Zod and implements generic CRUD and batch behavior.
- Per-domain services and Zod schemas live next to the client so the web app and external tools share the same contracts.

`new Api(backendHost, logger?)` uses one backend URL for all services, including `api.auth.dataExport` at `/api/auth/export`. The previous separate auth-host constructor argument has been removed.

See the runnable [`examples/api-key-client`](https://github.com/BudgetBuddyDE/BudgetBuddyDE/tree/main/examples/api-key-client) for API-key usage.

## Integrated MCP

`services/backend/src/mcp` exposes BudgetBuddy through the MCP SDK:

- **Endpoint:** `<backend URL>/mcp`, locally `http://localhost:9000/mcp`. Streamable HTTP handles POST; unsupported GET/DELETE requests receive the SDK's stateless transport response.
- **Transport:** stateless Streamable HTTP; each request gets its own server and transport, with no session IDs. Server identity remains `@budgetbuddyde/mcp`; its version follows the backend release.
- **Auth:** `x-api-key` or `Authorization: Bearer <API key>`, validated locally before processing, including initialization. `x-api-key` takes precedence. Cookies alone are rejected. Missing, invalid, expired, or disabled keys receive `401`; unexpected authentication errors receive a generic `503`.
- **Tools:** all 28 existing names, input schemas, text responses, and `isError` contracts are preserved. They cover categories, payment methods, transactions, recurring payments, budgets, and attachments.
- **Origins:** backend `TRUSTED_ORIGINS` applies to browser clients; untrusted Origins receive `403`. Clients without an Origin header remain allowed.
- **Rate limit:** independent 120 requests per minute and IP in production, using backend cache Redis when configured or an in-memory fallback. The API-key limit also applies; the domain HTTP limiter does not.
- **Health and lifecycle:** backend `/health`, logging, and tracing cover MCP. Request completion, errors, client aborts, and backend shutdown close the corresponding transports and servers.

Shared domain services receive the key owner explicitly and preserve REST validation, pagination, ownership, transactions, and error behavior. Successful MCP mutations invalidate the same owner-scoped response caches as REST mutations. MCP reads access the services directly rather than the REST response cache.

## Next steps

- [Adding a feature](/developers/adding-a-feature)
- [API keys and MCP (user guide)](/users/api-keys)
