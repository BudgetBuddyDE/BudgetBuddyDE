---
title: Configuration
description: Every environment variable for every workspace.
icon: Settings
---

Each workspace reads its own `.env` file. Copy the matching `.env.example` and adjust the values. This page is the single reference for all variables.

## Backend (`services/backend/.env`)

The backend serves domain routes, Better Auth under `/api/auth/*`, and MCP at `/mcp`. It uses one PostgreSQL database with the existing auth and domain schemas.

| Variable                                      | Required    | Default                                      | Description                                                                                                                                   |
| --------------------------------------------- | ----------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                | Yes         | N/A                                          | PostgreSQL connection string for both schemas.                                                                                                |
| `AUTH_SECRET`                                 | Yes         | N/A                                          | Session/token signing secret; preserve the existing value during migration.                                                                   |
| `RESEND_API_KEY`                              | Yes         | N/A                                          | Transactional verification, password reset, email change, and account deletion emails.                                                        |
| `BASE_URL`                                    | Production  | `http://localhost:<PORT>` outside production | Complete HTTP(S) backend origin, including a port if needed. Paths, queries, fragments, and credentials are rejected. Required in production. |
| `TRUSTED_ORIGINS`                             | Production  | `http://localhost:3000` for auth             | Comma-separated web app and browser MCP client origins allowed for authentication, MCP Origin checks, and CORS.                               |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`   | No          | N/A                                          | Enable GitHub sign-in when both are set.                                                                                                      |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`   | No          | N/A                                          | Enable Google sign-in when both are set.                                                                                                      |
| `DISABLE_CSRF_CHECK`                          | No          | `false`                                      | Set to `true` only when your deployment requires disabling CSRF checks.                                                                       |
| `DISABLE_SIGNUP`                              | No          | `false`                                      | Close public registration.                                                                                                                    |
| `AUTH_REDIS_URL`                              | No          | N/A                                          | Independent Redis connection for auth sessions and auth HTTP rate limiting. Without it, sessions use PostgreSQL.                              |
| `AUTH_REDIS_DB`                               | No          | `0`                                          | Auth Redis database index; preserve the previous session store during migration.                                                              |
| `REDIS_URL`                                   | No          | N/A                                          | Response cache, domain HTTP limits, and MCP HTTP limits. Does not enable auth Redis.                                                          |
| `REDIS_DB`                                    | No          | `1`                                          | Backend cache Redis database index.                                                                                                           |
| `AWS_ENDPOINT_URL`                            | Attachments | N/A                                          | S3-compatible storage endpoint.                                                                                                               |
| `AWS_S3_BUCKET_NAME`                          | Attachments | N/A                                          | Attachment bucket.                                                                                                                            |
| `AWS_DEFAULT_REGION`                          | Attachments | N/A                                          | Storage region, for example `eu-central-1`.                                                                                                   |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Attachments | N/A                                          | Storage credentials.                                                                                                                          |
| `PORT`                                        | No          | `9000`                                       | Backend HTTP port.                                                                                                                            |
| `LOG_LEVEL`                                   | No          | `INFO`                                       | Log verbosity.                                                                                                                                |
| `LOG_HIDE_META`                               | No          | `false`                                      | Hide request metadata from logs.                                                                                                              |
| `TIMEZONE`                                    | No          | `Europe/Berlin`                              | Recurring-payment job and monthly budget calculations.                                                                                        |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                 | No          | Unset                                        | Enables backend OTLP/HTTP log and trace export to this base URL.                                                                              |
| `OTEL_SERVICE_NAME`                           | No          | Backend package name                         | Service name used for exported logs and traces.                                                                                               |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                 | No          | `http/protobuf`                              | OTLP transport; use `http/protobuf` for the Grafana stack.                                                                                    |
| `OTEL_EXPORTER_OTLP_HEADERS`                  | No          | Unset                                        | OTLP headers, for example Basic Auth; store as a secret.                                                                                      |

All five `AWS_*` values must be set together for attachments. Auth and cache Redis may use the same server with separate database indices.

## MCP endpoint

MCP is served by the backend at `/mcp` and uses its existing environment. No separate MCP `.env`, port, or backend-host variable is needed. `TRUSTED_ORIGINS` also controls browser MCP clients: add their exact origins; clients without an Origin header remain allowed. `NODE_ENV=production` enables the independent 120 requests/minute/IP MCP limit. Backend `REDIS_URL` / `REDIS_DB` stores its counters when configured; otherwise the limiter uses memory.

The example client's `BUDGETBUDDY_BACKEND_URL` remains supported, as documented below.

## Web app (`apps/webapp/.env`)

| Variable                           | Required | Default | Description                                                          |
| ---------------------------------- | -------- | ------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_BACKEND_SERVICE_HOST` | Yes      | -       | Public URL of the backend, for example `http://localhost:9000`.      |
| `OTEL_EXPORTER_OTLP_ENDPOINT`      | No       | -       | Set to enable server-side tracing via the OTLP endpoint (see below). |
| `NEXT_PUBLIC_OTEL_ENDPOINT`        | No       | -       | Set to enable client-side tracing via the OTLP endpoint (see below). |

> `NEXT_PUBLIC_*` variables are inlined during the build. Set them before running `vp run build`, and rebuild after changing them.

## Database migrations (`packages/db/.env`)

| Variable       | Required | Default | Description                                                        |
| -------------- | -------- | ------- | ------------------------------------------------------------------ |
| `DATABASE_URL` | Yes      | -       | PostgreSQL connection string used by `db:migrate` and `db:studio`. |

## Example client (`examples/api-key-client/.env`)

| Variable                   | Required | Default | Description                                            |
| -------------------------- | -------- | ------- | ------------------------------------------------------ |
| `BUDGETBUDDY_API_KEY`      | Yes      | -       | An API key created in the web app.                     |
| `BUDGETBUDDY_BACKEND_URL`  | Yes      | -       | Base URL of your backend.                              |
| `BUDGETBUDDY_RESULT_LIMIT` | No       | `5`     | How many transactions and recurring payments to print. |

## GitHub and Google sign-in

Create OAuth apps in the provider consoles and configure the redirect URIs with the public backend URL from `BASE_URL`:

- GitHub: `https://backend.example.com/api/auth/callback/github`
- Google: `https://backend.example.com/api/auth/callback/google`

Then set the client ID and secret in `services/backend/.env`. Providers are only enabled when both values are present.

## Email delivery with Resend

All transactional emails go through [Resend](https://resend.com). Create an API key, verify your sending domain there, and set `RESEND_API_KEY`. Without a working key, registration and password reset emails cannot be delivered.

## Object storage

Attachments work with any S3-compatible storage. Set all five `AWS_*` variables in `services/backend/.env`. BudgetBuddy uses virtual-hosted-style addressing, so the endpoint must support it. The bucket needs permissions for read, write, and delete of objects.

## Backend logs and traces (OpenTelemetry)

The normal backend and Docker production start loads instrumentation before HTTP and Express. Set `OTEL_EXPORTER_OTLP_ENDPOINT` to enable OTLP/HTTP log and trace export; when it is unset, export is disabled and console logging remains available. The existing `start:instrumentation` command remains supported. The `dev` command does not preload instrumentation.

```bash
OTEL_SERVICE_NAME=budgetbuddy-backend
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel.example.com
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic%20BASE64_USERNAME_AND_PASSWORD
```

Use the base URL without `/v1/logs` or `/v1/traces`; the exporter adds the appropriate path. For the homelab stack use its OTLP gateway and an individual service credential. Generate the header from the gateway credentials and store it in your deployment's secret manager, not in a committed file. Basic Auth is not encryption: use HTTPS for a remote collector. Local host-only testing can use `http://127.0.0.1:14318`.

HTTP and Express requests, including MCP, are traced; `/health` server spans are filtered. Existing console logs are also exported with their metadata and active trace context. Known credential fields and recognizable credentials in text are redacted before log export, but arbitrary secrets cannot be detected reliably. Existing logs may contain user IDs, IP addresses, and URLs; review their contents and your retention policy before enabling export. Export failures do not block requests, and shutdown waits at most five seconds for telemetry to flush.

The web app uses Next.js' built-in instrumentation instead. Server-side tracing is enabled by setting `OTEL_EXPORTER_OTLP_ENDPOINT` (Next.js spans for routing, rendering, and fetch are emitted automatically; set `NEXT_OTEL_VERBOSE=1` to see more). Client-side tracing is enabled by setting `NEXT_PUBLIC_OTEL_ENDPOINT` - it is inlined at build time, so set it before `vp run build`. Because the browser sends spans directly to the collector, the collector must allow cross-origin requests from your web app origin (for example, Jaeger with `--collector.otlp.http.cors.allowed-origins=https://your-app-origin`).

## Next step

- [Production](/self-hosting/production)
