# Nitro backend

Copy `.env.example` to `.env` and set `AUTH_SECRET` and `RESEND_API_KEY`. For a parallel run, use the same secret, PostgreSQL database and auth Redis settings as the existing backend. The Redis `auth` mount deliberately has no key prefix; application KV data uses the separate `kv` mount. Omit `AUTH_REDIS_URL` to use PostgreSQL sessions.

From the workspace root, run `docker compose up -d db cache`. Apply the existing migrations with `pnpm --filter @budgetbuddyde/db db:migrate` using the intended `DATABASE_URL`. Start with `pnpm exec turbo run dev --filter=@budgetbuddyde/new-backend` (port 9100).

`GET /health` returns `200 OK` only when PostgreSQL and KV Redis respond. If `AUTH_REDIS_URL` is set, Auth Redis must respond too. Missing configuration, outages, and timeouts return `503 Service Unavailable`. The check does not require mail or auth secrets and does not verify database migrations.

`BackendConfig.getInstance()` reads the environment once per running server process. Restart the server to apply changes. See `.env.example` for required values, optional settings, and defaults. Authentication returns `503` when required configuration is missing or invalid; `BASE_URL` and `TRUSTED_ORIGINS` are required explicitly in production.

The webapp still targets the existing backend. The custom auth export and production HTTP rate limits must be ported before cutover.
