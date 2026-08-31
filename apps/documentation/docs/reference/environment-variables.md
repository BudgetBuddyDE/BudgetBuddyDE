---
title: Environment Variables
description: Configuration for all BudgetBuddy components.
icon: lucide/sliders-horizontal
---

## Webapp

| Variable                           | Purpose                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_AUTH_SERVICE_HOST`    | Public auth-service URL, default `http://localhost:8080` |
| `NEXT_PUBLIC_BACKEND_SERVICE_HOST` | Public backend URL, default `http://localhost:9000`      |
| `NEXT_PUBLIC_LOG_LEVEL`            | Browser logging threshold, default `info`                |
| `NEXT_PUBLIC_APP_VERSION`          | Optional displayed package-version override              |

`NEXT_PUBLIC_*` values are browser-visible and embedded at `next build`; changing them requires rebuilding the webapp.

## Backend

| Variable                | Purpose                            |
| ----------------------- | ---------------------------------- |
| `AUTH_SERVICE_HOST`     | Internal URL of the auth service   |
| `DATABASE_URL`          | Required PostgreSQL connection     |
| `REDIS_URL`             | Required Redis connection          |
| `TRUSTED_ORIGINS`       | Allowed CORS origins               |
| `AWS_ENDPOINT_URL`      | Required S3 endpoint               |
| `AWS_S3_BUCKET_NAME`    | Required bucket for attachments    |
| `AWS_DEFAULT_REGION`    | Required S3 region                 |
| `AWS_ACCESS_KEY_ID`     | Required S3 access key             |
| `AWS_SECRET_ACCESS_KEY` | Required S3 secret                 |
| `PORT`                  | Optional HTTP port                 |
| `LOG_LEVEL`             | Log level                          |
| `LOG_HIDE_META`         | Hide metadata in logs              |
| `TIMEZONE`              | Time zone for time-dependent tasks |

## Auth Service

| Variable                                    | Purpose                        |
| ------------------------------------------- | ------------------------------ |
| `DATABASE_URL`                              | Required PostgreSQL connection |
| `AUTH_SECRET`                               | Secret for Better Auth         |
| `TRUSTED_ORIGINS`                           | Allowed origins                |
| `RESEND_API_KEY`                            | Required email delivery key    |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth          |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth          |
| `REDIS_URL`, `REDIS_DB`                     | Optional Redis connection      |
| `BASE_URL`, `PORT`, `NODE_ENV`              | Service URL and runtime        |
| `LOG_LEVEL`, `LOKI_URL`, `TIMEZONE`         | Logging and timezone options   |
| `DISABLE_SIGNUP`                            | Disable new email sign-ups     |
| `DISABLE_CSRF_CHECK`                        | Disable Better Auth CSRF check |

## MCP Service

| Variable                  | Purpose             |
| ------------------------- | ------------------- |
| `BUDGETBUDDY_BACKEND_URL` | Backend URL         |
| `PORT`                    | Optional HTTP port  |
| `NODE_ENV`                | Runtime environment |
| `LOG_LEVEL`               | Log level           |

Example files are the authoritative list of currently supported variables. Values in this documentation are not production-safe defaults.

Backend and auth service validate their required environment variables during central `AppConfig` construction. Blank required values are rejected.
