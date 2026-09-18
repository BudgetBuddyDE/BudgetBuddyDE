---
title: Configuration
description: Every environment variable for every workspace.
icon: Settings
---

Each workspace reads its own `.env` file. Copy the matching `.env.example` and adjust the values. This page is the single reference for all variables.

## Auth service (`services/auth-service/.env`)

| Variable                                    | Required   | Default                 | Description                                                                                                                                    |
| ------------------------------------------- | ---------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                              | Yes        | —                       | PostgreSQL connection string.                                                                                                                  |
| `AUTH_SECRET`                               | Yes        | —                       | Secret for signing sessions and tokens. Use a long random value in production.                                                                 |
| `RESEND_API_KEY`                            | Yes        | —                       | Resend API key for transactional emails (verification, password reset, email change, account deletion). The service does not start without it. |
| `BACKEND_HOST_URL`                          | Yes        | —                       | Public URL of your backend, for example `http://localhost:9000`.                                                                               |
| `TRUSTED_ORIGINS`                           | Production | `http://localhost:3000` | Comma-separated web app origins allowed for CORS and authentication. Must be set in production.                                                |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | No         | —                       | Enable GitHub sign-in. Both must be set.                                                                                                       |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No         | —                       | Enable Google sign-in. Both must be set.                                                                                                       |
| `REDIS_URL`                                 | No         | —                       | Redis for session storage. Recommended in production.                                                                                          |
| `REDIS_DB`                                  | No         | `0`                     | Redis database index.                                                                                                                          |
| `BASE_URL`                                  | No         | `http://localhost`      | Public base URL of the auth service. Used as the Better Auth base URL in production.                                                           |
| `PORT`                                      | No         | `8080`                  | HTTP port.                                                                                                                                     |
| `LOG_LEVEL`                                 | No         | `info`                  | Log verbosity.                                                                                                                                 |
| `TIMEZONE`                                  | No         | `Europe/Berlin`         | Timezone for scheduled work.                                                                                                                   |
| `DISABLE_CSRF_CHECK`                        | No         | `false`                 | Set to `true` only for special setups; disables CSRF protection.                                                                               |
| `DISABLE_SIGNUP`                            | No         | `false`                 | Set to `true` to close public registration (useful for private instances).                                                                     |
| `OTEL_EXPORTER_OTLP_ENDPOINT`               | No         | `http://localhost:4318` | OTLP endpoint that receives traces when the service runs with tracing (see below).                                                             |

## Backend (`services/backend/.env`)

| Variable                                      | Required    | Default                 | Description                                                                                   |
| --------------------------------------------- | ----------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                | Yes         | —                       | PostgreSQL connection string.                                                                 |
| `AUTH_SERVICE_HOST`                           | No          | `http://localhost:8080` | Base URL of the auth service, used to validate sessions and API keys.                         |
| `TRUSTED_ORIGINS`                             | Production  | —                       | Comma-separated web app origins allowed for CORS. Must be set in production.                  |
| `REDIS_URL`                                   | No          | —                       | Redis. Enables the response cache and production rate limiting.                               |
| `REDIS_DB`                                    | No          | `1`                     | Redis database index.                                                                         |
| `AWS_ENDPOINT_URL`                            | Attachments | —                       | Endpoint of your S3-compatible storage.                                                       |
| `AWS_S3_BUCKET_NAME`                          | Attachments | —                       | Bucket for attachment files.                                                                  |
| `AWS_DEFAULT_REGION`                          | Attachments | —                       | Region, for example `eu-central-1`.                                                           |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Attachments | —                       | Credentials for the bucket.                                                                   |
| `PORT`                                        | No          | `9000`                  | HTTP port. (The shipped `.env.example` comment shows an outdated value; the default is 9000.) |
| `LOG_LEVEL`                                   | No          | `INFO`                  | Log verbosity.                                                                                |
| `LOG_HIDE_META`                               | No          | `false`                 | Hides request metadata from logs.                                                             |
| `TIMEZONE`                                    | No          | `Europe/Berlin`         | Timezone for the daily recurring-payment job and monthly budget calculations.                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                 | No          | `http://localhost:4318` | OTLP endpoint that receives traces when the backend runs with tracing (see below).            |

The five `AWS_*` variables must all be set together; if any is missing, attachments fail with an "Object storage is not configured" error.

## MCP service (`services/mcp/.env`)

| Variable                      | Required | Default                 | Description                                                                        |
| ----------------------------- | -------- | ----------------------- | ---------------------------------------------------------------------------------- |
| `BUDGETBUDDY_BACKEND_URL`     | Yes      | —                       | Base URL of your backend, for example `http://localhost:9000`.                     |
| `PORT`                        | No       | `8070`                  | HTTP port.                                                                         |
| `NODE_ENV`                    | No       | `development`           | `production` enables rate limiting (120 requests per minute).                      |
| `LOG_LEVEL`                   | No       | `info`                  | Log verbosity.                                                                     |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No       | `http://localhost:4318` | OTLP endpoint that receives traces when the service runs with tracing (see below). |

## Web app (`apps/webapp/.env`)

| Variable                           | Required | Default | Description                                                          |
| ---------------------------------- | -------- | ------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_AUTH_SERVICE_HOST`    | Yes      | —       | Public URL of the auth service, for example `http://localhost:8080`. |
| `NEXT_PUBLIC_BACKEND_SERVICE_HOST` | Yes      | —       | Public URL of the backend, for example `http://localhost:9000`.      |

> `NEXT_PUBLIC_*` variables are inlined during the build. Set them before running `npm run build`, and rebuild after changing them.

## Database migrations (`packages/db/.env`)

| Variable       | Required | Default | Description                                                        |
| -------------- | -------- | ------- | ------------------------------------------------------------------ |
| `DATABASE_URL` | Yes      | —       | PostgreSQL connection string used by `db:migrate` and `db:studio`. |

## Example client (`examples/api-key-client/.env`)

| Variable                   | Required | Default | Description                                            |
| -------------------------- | -------- | ------- | ------------------------------------------------------ |
| `BUDGETBUDDY_API_KEY`      | Yes      | —       | An API key created in the web app.                     |
| `BUDGETBUDDY_BACKEND_URL`  | Yes      | —       | Base URL of your backend.                              |
| `BUDGETBUDDY_RESULT_LIMIT` | No       | `5`     | How many transactions and recurring payments to print. |

## GitHub and Google sign-in

Create OAuth apps in the provider consoles and configure the redirect URIs with your public auth service URL:

- GitHub: `https://auth.example.com/api/auth/callback/github`
- Google: `https://auth.example.com/api/auth/callback/google`

Then set the client ID and secret in `services/auth-service/.env`. Providers are only enabled when both values are present.

## Email delivery with Resend

All transactional emails go through [Resend](https://resend.com). Create an API key, verify your sending domain there, and set `RESEND_API_KEY`. Without a working key, registration and password reset emails cannot be delivered.

## Object storage

Attachments work with any S3-compatible storage. Set all five `AWS_*` variables in `services/backend/.env`. BudgetBuddy uses virtual-hosted-style addressing, so the endpoint must support it. The bucket needs permissions for read, write, and delete of objects.

## Tracing (OpenTelemetry)

The backend, MCP, and auth services ship with OpenTelemetry tracing for the HTTP and Express layers. Regular `npm start` runs without tracing; start a service with instrumentation to enable it:

```bash
npm run start:instrumentation --workspace services/backend
npm run start:instrumentation --workspace services/mcp
npm run start:instrumentation --workspace services/auth-service
```

Traces are exported via OTLP to the endpoint configured with `OTEL_EXPORTER_OTLP_ENDPOINT` (default `http://localhost:4318`), so any OTLP-compatible collector or backend such as Jaeger or Grafana Tempo works. Health-check requests to `/health` are filtered out and not sampled.

## Next step

- [Production](/self-hosting/production)
