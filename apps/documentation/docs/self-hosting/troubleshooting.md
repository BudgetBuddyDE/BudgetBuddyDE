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
- **Wrong `TRUSTED_ORIGINS`:** the auth service and backend only accept the origins listed there. Include the exact web app origin, including scheme and port.
- **Custom domain:** production cross-subdomain cookies are preset to `.budget-buddy.de`. Change the domain in `services/auth-service/src/auth.ts` for your own domain. See [Production](/self-hosting/production#important-cookie-domain).
- **Web app cannot reach the auth service:** it uses the browser-facing URL from `NEXT_PUBLIC_AUTH_SERVICE_HOST`. After changing it, rebuild the web app; the value is inlined at build time.

## OAuth login fails

The redirect URI registered with GitHub or Google must match your public auth URL exactly: `https://auth.example.com/api/auth/callback/github` (or `/google`). Also make sure both the client ID and secret are set, because a provider is only enabled when both are present.

## Backend returns 401 for every request

The backend validates sessions against `AUTH_SERVICE_HOST`. If it points to the wrong address or the auth service is down, every request is unauthorized. Check the backend log for session errors.

## Attachments fail

`Object storage is not configured. Set AWS_ENDPOINT_URL, ...` means at least one of the five `AWS_*` variables is missing. All five must be set. If uploads fail despite the configuration, verify the bucket name, credentials, and that your storage supports virtual-hosted-style addressing.

## Emails are not delivered

The auth service requires `RESEND_API_KEY`. Verify the key and that your sending domain is verified in Resend. Without working email delivery, users cannot reset passwords, change emails, or delete accounts.

## The app is slow or the cache seems inactive

Redis is optional. When `REDIS_URL` is not set, the backend response cache and production rate limiting are disabled and sessions are stored in PostgreSQL. Configure Redis to enable them.

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
- Health endpoints: web app `/api/health`, backend `/health`, MCP service `/health`.
- Search or open an issue on [GitHub](https://github.com/BudgetBuddyDE/BudgetBuddyDE/issues).
