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
