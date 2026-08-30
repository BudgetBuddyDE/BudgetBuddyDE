---
title: Environment Variables
description: Configuration for all BudgetBuddy components.
icon: lucide/sliders-horizontal
---

## Webapp

| Variable                           | Purpose                        |
| ---------------------------------- | ------------------------------ |
| `NEXT_PUBLIC_AUTH_SERVICE_HOST`    | Public URL of the auth service |
| `NEXT_PUBLIC_BACKEND_SERVICE_HOST` | Public URL of the backend      |

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
| `BACKEND_HOST_URL`                          | Backend URL                    |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth          |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth          |
| `REDIS_URL`                                 | Required Redis connection      |
| `BASE_URL`                                  | Service base URL               |
| `LOG_LEVEL`, `LOG_HIDE_META`, `TIMEZONE`    | Runtime and logging options    |

## MCP Service

| Variable                  | Purpose             |
| ------------------------- | ------------------- |
| `BUDGETBUDDY_BACKEND_URL` | Backend URL         |
| `PORT`                    | Optional HTTP port  |
| `NODE_ENV`                | Runtime environment |
| `LOG_LEVEL`               | Log level           |

Example files are the authoritative list of currently supported variables. Values in this documentation are not production-safe defaults.

Backend, auth service, database tooling, and the API-key example retrieve required values through [`EnvironmentVariable`](core.md#environment-variables). The accessor throws `EnvironmentNotSetError` only when `process.env` has no value for the requested name.
