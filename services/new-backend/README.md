# Nitro backend

Copy `.env.example` to `.env` and set `AUTH_SECRET` and `RESEND_API_KEY`. For a parallel run, use the same secret, PostgreSQL database and auth Redis settings as the existing backend. The Redis `auth` mount deliberately has no key prefix; application KV data uses the separate `kv` mount. Omit `AUTH_REDIS_URL` to use PostgreSQL sessions.

From the workspace root, run `docker compose up -d db cache`. Apply the existing migrations with `pnpm --filter @budgetbuddyde/db db:migrate` using the intended `DATABASE_URL`. Start with `pnpm exec turbo run dev --filter=@budgetbuddyde/new-backend` (port 9100).

## Auth compatibility test

Build both services with `pnpm exec turbo run build --filter=@budgetbuddyde/backend --filter=@budgetbuddyde/new-backend`. Set `TEST_DATABASE_URL` to a migrated disposable database on localhost named `nitro_auth_smoke_<suffix>` and `TEST_REDIS_URL` to local Redis (reserve DB 15 for the test). Run `node services/new-backend/tests/auth-smoke.mjs` from the workspace root. It starts both built servers and a local mail stub, checks signed cookies in both directions, and leaves test records in the disposable stores.

The webapp still targets the existing backend. The custom auth export and production HTTP rate limits must be ported before cutover.
