---
title: Configuration
description: Configure the runtime behavior of BudgetBuddy components.
icon: lucide/settings-2
---

The complete variable list is in the [environment variable reference](../reference/environment-variables.md). This page describes the most important relationships.

## Connect Services

- The webapp requires `NEXT_PUBLIC_AUTH_SERVICE_HOST` and `NEXT_PUBLIC_BACKEND_SERVICE_HOST`.
- The backend requires `AUTH_SERVICE_HOST`, `DATABASE_URL`, `REDIS_URL`, and `TRUSTED_ORIGINS`.
- The auth service requires `DATABASE_URL`, `AUTH_SECRET`, `TRUSTED_ORIGINS`, and the backend URL.
- The MCP service requires `BUDGETBUDDY_BACKEND_URL`.

## Recurring Payments

The backend service processes recurring payments through a cron job. The schedule, activation, and time zone are controlled through the backend configuration. After changes, check the service logs and the next expected run.

## Attachments

For the backend service, set `AWS_ENDPOINT_URL`, `AWS_S3_BUCKET_NAME`, `AWS_DEFAULT_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`. `AWS` refers to the S3-compatible interface here; the actual provider may differ.

## Security

- Use a random value for `AUTH_SECRET` in production.
- Restrict `TRUSTED_ORIGINS` to known frontend and service origins.
- Do not use the example passwords from `docker-compose.yml` in a public environment.
- Enable rate limiting in the backend and auth service.
