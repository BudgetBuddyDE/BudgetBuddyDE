---
title: Troubleshooting
description: Common problems and their fixes.
icon: Wrench
---

## The service does not start

The services log a clear error when a required variable is missing, for example:

```text
EnvironmentNotSetError: RESEND_API_KEY
```

Check the matching workspace `.env` against [Configuration](/self-hosting/configuration). Services only read their own `.env` file, not a shared one.

## Sign-in fails or sessions are lost

- **HTTP instead of HTTPS in production:** production cookies are `Secure` and `SameSite=None`; browsers reject them over plain HTTP. Use TLS.
- **Wrong `TRUSTED_ORIGINS`:** the backend only accepts the origins listed there. Include the exact web app origin, including scheme and port.
- **Custom domain:** production cross-subdomain cookies are preset to `.budget-buddy.de`. Change the domain in `services/backend/src/auth.ts` for your own domain. See [Production](/self-hosting/production#important-cookie-domain).
- **Web app cannot reach authentication:** it uses `/api/auth/*` on the browser-facing URL from `NEXT_PUBLIC_BACKEND_SERVICE_HOST`. After changing it, rebuild the web app; the value is inlined at build time.

## OAuth login fails

The redirect URI registered with GitHub or Google must match your public auth URL exactly: `https://backend.example.com/api/auth/callback/github` (or `/google`). Also make sure both the client ID and secret are set, because a provider is only enabled when both are present.

## Backend returns 401 for every request

The backend validates sessions locally with Better Auth. Check that the cookie is sent to the backend origin, `AUTH_SECRET` matches the previous deployment, and `AUTH_REDIS_URL` / `AUTH_REDIS_DB` still point to the old session store. API-key callers must send `x-api-key`. See [Updating](/self-hosting/updating#integrated-authentication-cutover).

## Attachments fail

`Object storage is not configured. Set AWS_ENDPOINT_URL, ...` means at least one of the five `AWS_*` variables is missing. All five must be set. If uploads fail despite the configuration, verify the bucket name, credentials, and that your storage supports virtual-hosted-style addressing.

## Emails are not delivered

The backend requires `RESEND_API_KEY`. Verify the key and that your sending domain is verified in Resend. Without working email delivery, users cannot reset passwords, change emails, or delete accounts.

## The app is slow or the cache seems inactive

Redis is optional. When `REDIS_URL` is not set, the backend response cache and domain rate limiting are disabled. Auth uses the independent `AUTH_REDIS_URL`: without it, sessions are stored in PostgreSQL. Auth HTTP rate limits can use either auth Redis or cache Redis and are disabled if neither URL is configured. Configure the respective Redis connection to enable these capabilities.

## Recurring payments are not created

- The backend must be running; the job executes once per day at 01:30 in the configured `TIMEZONE`.
- Paused recurring payments are skipped by design.
- Only occurrences due today or earlier are created; check the occurrences view in the app.

## "relation does not exist" errors

Migrations were not applied. Run:

```bash
npm run db:migrate --workspace @budgetbuddyde/db
```

The command reads `DATABASE_URL` from `packages/db/.env`; make sure it points to the same database the backend uses.

## Still stuck?

- Check the service logs first; each service logs configuration, requests, and job runs.
- Health endpoints: web app `/api/health` and backend `/health`; the backend check covers the infrastructure used by MCP.
- MCP clients connect to `<backend URL>/mcp`. A `401` requires a valid API key, even for initialization; cookies alone do not authenticate MCP. A `403` with an Origin header requires adding that browser client origin to backend `TRUSTED_ORIGINS`.
- Search or open an issue on [GitHub](https://github.com/BudgetBuddyDE/BudgetBuddyDE/issues).
