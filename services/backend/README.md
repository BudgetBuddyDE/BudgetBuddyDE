# `@budgetbuddyde/backend`

For full documentation, visit **[docs.budget-buddy.de › Services › Backend](https://docs.budget-buddy.de/services/backend/)**.

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Start in development mode
npm run dev

# Build for production
npm run build

# Start in production mode
npm start
```

## Integrated authentication

Better Auth runs in this backend at `/api/auth/*`, including registration, sessions, OAuth, email verification, password resets, account management, and API keys. `GET /api/auth/export?format=json|csv` provides the auth metadata ZIP export. `/api/me` retains the domain `ApiResponse` request-context contract.

Set `AUTH_SECRET`, `RESEND_API_KEY`, and, in production, `BASE_URL` to the complete public backend URL. Use `NEXT_PUBLIC_BACKEND_SERVICE_HOST` in the web app for both domain and auth requests. OAuth callbacks use `<BASE_URL>/api/auth/callback/github` or `/google`.

`AUTH_REDIS_URL` / `AUTH_REDIS_DB` (default `0`) configure auth sessions independently of cache `REDIS_URL` / `REDIS_DB` (default `1`). Without auth Redis, sessions use PostgreSQL. Auth and domain tables use the existing database schemas and connection.

Follow the [cutover guide](https://docs.budget-buddy.de/self-hosting/updating#integrated-authentication-cutover) when replacing an existing standalone authentication deployment. Preserve its signing secret, cookies, and session store. External hosting, OAuth, proxy, and Concourse configuration changes must be performed by the operator.

## Integrated MCP

The stateless Streamable HTTP endpoint runs at `<backend URL>/mcp`, locally `http://localhost:9000/mcp`. All 28 existing tools retain their names, input schemas, and MCP response contracts. REST and MCP use shared internal domain services with explicit owner context, transactions, and common cache invalidation after successful writes. No HTTP loopback client or separate MCP process is needed.

Send a valid key using `x-api-key` or `Authorization: Bearer <API key>`; `x-api-key` takes precedence. Keys are validated locally for every request, including initialization; cookies alone do not authenticate MCP. Missing or invalid keys receive `401`, and unexpected auth failures receive a generic `503`.

Browser MCP origins must be included in `TRUSTED_ORIGINS`; untrusted origins receive `403`, while clients without an Origin header remain allowed. In production the independent MCP limit is 120 requests/minute/IP, using cache Redis when available or memory otherwise. API-key limits also apply. Backend health, logging, tracing, and shutdown cover MCP; each request owns its server and transport without session IDs.

Follow the [MCP cutover guide](https://docs.budget-buddy.de/self-hosting/updating#integrated-mcp-cutover) to update clients and proxies and retire the previous deployment and pipeline. Existing API keys remain valid; no schema migration is required. The API-key example retains its `BUDGETBUDDY_BACKEND_URL` setting.

## Tests

Backend unit tests mock external database, Redis, mail, storage, and HTTP boundaries. Coverage requires at least 80% for statements, branches, functions, and lines:

```bash
npx turbo run test --filter=@budgetbuddyde/backend
```

## Credits

- [ExpressJS](https://expressjs.com/)
- [Drizzle ORM](https://orm.drizzle.team/)

## Configuration

All service configuration is centralized in [`src/config.ts`](src/config.ts). This includes environment-backed
infrastructure settings as well as rate limiting, scheduled jobs, caching, and attachment processing limits.
Backend modules consume the exported `config` object instead of reading environment variables directly.

## Attachment performance and safety

Transaction attachment endpoints are optimized for large attachment collections:

- `GET /api/transaction/:id/attachments` is paginated. When no range is supplied, the backend returns the first 24 attachments and caps each request at 100 attachments.
- `GET /api/transaction` returns only a small signed-url preview per transaction while still returning `attachmentCount` for the full count.
- Uploads are protected with server-side limits of 10 files per request and 20 MiB per file. The backend validates attachment content types and only accepts the configured image formats.
- Signed URLs remain short-lived and are generated only for the attachments that are actually returned to the client.
