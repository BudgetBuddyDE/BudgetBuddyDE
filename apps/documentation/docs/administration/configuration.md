---
title: Configuration
description: Configure the runtime behavior of BudgetBuddy components.
icon: Settings2
---

The complete variable list is in the [environment variable reference](/reference/environment-variables). This page describes the most important relationships.

## Connect Services

- The webapp defaults to a local `NEXT_PUBLIC_BACKEND_SERVICE_HOST` value. Set it explicitly for production before building because public values are embedded in browser bundles.
- The webapp hosts Better Auth and requires `DATABASE_URL`, `AUTH_SECRET`, and `RESEND_API_KEY` at runtime. `TRUSTED_ORIGINS` is required in production; `BASE_URL` sets the Better Auth base URL.
- The backend requires `AUTH_URL` (the webapp's Better Auth endpoint), `DATABASE_URL`, `REDIS_URL`, and `TRUSTED_ORIGINS`.
- The MCP service requires `BUDGETBUDDY_BACKEND_URL`.

## Recurring Payments

The backend service processes recurring payments through a cron job. The schedule, activation, and time zone are controlled through the backend configuration. After changes, check the service logs and the next expected run.

### Operational Limitations

- **Run exactly one scheduler:** Executions are not idempotent yet. Starting the job more than once for the same calendar day, including through multiple backend instances, can create duplicate transactions. Run only one backend scheduler and do not blindly retry a run.
- **No automatic catch-up:** The job creates transactions only for occurrences due on its current run date. Payments missed while the backend is unavailable are not created automatically and must be reconciled manually.
- **Partial runs require reconciliation:** Transactions are created independently. If one insertion fails, other due payments may already have been created. Review the job error log and the affected transactions before manually retrying the run.

## Attachments

For the backend service, set `AWS_ENDPOINT_URL`, `AWS_S3_BUCKET_NAME`, `AWS_DEFAULT_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`. `AWS` refers to the S3-compatible interface here; the actual provider may differ.

## Security

- Use a random value for `AUTH_SECRET` in production.
- Restrict `TRUSTED_ORIGINS` to known frontend and service origins.
- Do not use the example passwords from `docker-compose.yml` in a public environment.
- Enable rate limiting in the webapp (Better Auth) and backend.
