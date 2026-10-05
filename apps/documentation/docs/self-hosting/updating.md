---
title: Updating
description: Upgrade a self-hosted instance and keep backups.
icon: RefreshCw
---

## Back up first

Always create a database backup before updating:

```bash
docker exec db pg_dump -U myuser mydatabase > backup-$(date +%Y-%m-%d).sql
```

If you use attachments, back up your object storage bucket as well.

## Update

```bash
git pull
npm install
npm run db:migrate --workspace @budgetbuddyde/db
npm run build
```

Then restart your services so they run the new build.

Migrations are the only step that touches existing data. They are additive in normal releases, but a backup is still the fastest way back if something goes wrong.

## Integrated authentication cutover

Authentication is now part of the backend at `/api/auth/*`; the standalone authentication workspace has been removed. Perform a coordinated cutover of backend and web app. This is a direct cutover with no legacy auth-host variable or route aliases.

1. Back up PostgreSQL and retain the old deployment configuration for rollback. The existing auth and domain schemas remain unchanged, and both must be present in the backend's `DATABASE_URL` database.
2. Copy `AUTH_SECRET`, `RESEND_API_KEY`, OAuth credentials, and auth feature flags into the backend environment. Preserve the signing secret and cookie settings. Set `BASE_URL` to the complete public backend URL.
3. If sessions previously used Redis, copy the old auth `REDIS_URL` to backend `AUTH_REDIS_URL` and the old auth `REDIS_DB` to `AUTH_REDIS_DB` (default `0`). Keep cache `REDIS_URL` / `REDIS_DB` (default `1`) separate. Without the previous auth store, existing Redis-backed sessions cannot be recovered and users must sign in again.
4. Remove backend `AUTH_SERVICE_HOST` and web app `NEXT_PUBLIC_AUTH_SERVICE_HOST`. Set web app `NEXT_PUBLIC_BACKEND_SERVICE_HOST` and rebuild. Custom API consumers must use `new Api(backendHost, logger?)`; auth exports move from `/api/export` on the old auth host to `/api/auth/export` on the backend.
5. Update reverse proxies, GitHub/Google callback registrations, Railway environment bindings/templates, and any monitoring or health checks to the backend URL. Stop the old auth process as part of the cutover. `/api/me` retains the backend `ApiResponse` contract.
6. Verify sign-in, session continuation, OAuth, password-reset emails, API keys/MCP, and both auth and application exports. Then retire the standalone authentication deployment and Concourse pipeline. The backend pipeline covers authentication and domain code, with 80% minimum unit coverage for statements, branches, functions, and lines.

No repository command automatically changes OAuth providers, reverse proxies, hosting templates, or live pipelines. Rollback requires restoring the previous environment layout, callback URLs, web app build, and standalone auth process together.

## Integrated MCP cutover

MCP now runs inside the backend at `/mcp`; the standalone MCP workspace is removed. This is a direct cutover with no aliases for old MCP URLs. There is no database migration, new MCP host variable, or change to existing API keys. All 28 tool names, schemas, and MCP responses remain supported.

1. Retain the old backend/MCP builds, client URLs, proxy configuration, and pipeline settings for rollback. Deploy the new backend using the existing backend build/start commands and Node.js 24.21.0. Its pipeline tests authentication, REST, and MCP together with 80% minimum coverage for statements, branches, functions, and lines.
2. Route `/mcp` on the public backend host to the backend process. Preserve the proxy's Streamable HTTP behavior and configure trusted proxy handling correctly for per-IP limits. MCP now shares backend logging, tracing, and `/health`; remove separate MCP health forwarding.
3. Change every MCP client's endpoint from the old MCP host or `http://localhost:8070/mcp` to `<Backend-URL>/mcp`, locally `http://localhost:9000/mcp`. Keep the existing API key. Both `x-api-key` and `Authorization: Bearer <API key>` remain supported; `x-api-key` takes precedence. Cookies alone are rejected, including initialization requests.
4. Add exact browser MCP client origins to backend `TRUSTED_ORIGINS`. Untrusted origins receive `403`; clients that send no Origin header remain allowed. In production MCP has an independent 120 requests/minute/IP limit, using cache Redis when configured or an in-memory fallback, alongside the API-key limit.
5. Remove the old MCP environment bindings and deployment templates. The MCP service's `BUDGETBUDDY_BACKEND_URL` setting is no longer needed; the independent `examples/api-key-client` still uses its identically named variable. No separate MCP port, credentials, or environment file needs to be copied into the backend.
6. Verify backend health, an authenticated MCP initialization, `tools/list` (28 tools), representative read/write tool calls, owner isolation, and REST cache refresh after an MCP mutation. Check invalid-key rejection and browser Origin handling. After verification, shut down the old MCP process and retire its Concourse pipeline, release automation, and monitoring.

Repository changes do not update external client registrations, reverse proxies, Railway services/templates, or live pipelines. Rollback requires restoring the previous backend build, standalone MCP deployment, client endpoints, and proxy routing together.

## Verify

After restarting:

- Check the [health endpoints](/self-hosting/installation#6-verify), including database and Redis connectivity.
- Sign in and open the dashboard once.
- Check the backend logs for errors from the daily recurring-payment job.

## Rolling back

1. Stop the services.
2. Check out the previous release (`git checkout <tag>`).
3. Restore the backup if the update included a schema migration you need to undo.
4. Run `npm install` and `npm run build` again, then restart.

## Next step

- [Troubleshooting](/self-hosting/troubleshooting)
