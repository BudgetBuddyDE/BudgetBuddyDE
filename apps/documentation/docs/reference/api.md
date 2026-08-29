---
title: API Overview
description: Backend API resources, URLs, filters, and response format.
icon: lucide/terminal
---

## Basics

The backend API is available under `/api`. The base URL is configured in the webapp through `NEXT_PUBLIC_BACKEND_SERVICE_HOST`.

## Resources

| Resource           | Path                      |
| ------------------ | ------------------------- |
| Categories         | `/api/category`           |
| Payment methods    | `/api/paymentMethod`      |
| Transactions       | `/api/transaction`        |
| Recurring payments | `/api/recurringPayment`   |
| Budgets            | `/api/budget`             |
| Insights           | `/api/insights`           |
| Attachments        | `/api/attachment`         |
| Application export | `/api/application/export` |
| Application import | `/api/application/import` |
| User context       | `/api/me`                 |

The specific methods and payloads are defined in `packages/api` and the backend routers. Prefer the typed client over manual HTTP calls.

## Response Format

The client uses `TResult`: either `[data, null]` or `[null, error]`. Do not introduce a second error convention.

## Batch and Filters

Batch operations are limited to 100 records. Query filters are serialized by the client; the backend service validates and interprets them.

## Application Export

`GET /api/application/export` creates a ZIP archive for the authenticated owner. The endpoint accepts these query parameters:

| Parameter   | Values                                                                                          | Required         | Description                                        |
| ----------- | ----------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------- |
| `format`    | `json`, `csv`                                                                                   | Yes              | Format of each resource file in the archive.       |
| `resources` | `categories`, `payment-methods`, `transactions`, `recurring-payments`, `budgets`, `attachments` | Yes, one or more | Repeat the parameter for every resource to export. |

For example:

```text
GET /api/application/export?format=json&resources=transactions&resources=categories
```

The response is an `application/zip` attachment containing each requested resource and a `manifest.json`. It is owner-scoped
and uses `Cache-Control: no-store`.

When `attachments` is selected, the archive also contains the uploaded file content. `attachments.json` or `attachments.csv`
maps each attachment to its archive `contentPath` and associated transaction IDs. If an object cannot be retrieved from the
configured object store, the request fails instead of producing an incomplete archive.

### Rate Limit

In production, this endpoint accepts up to four export requests per authenticated owner in a 15-minute window. Requests
without an authenticated owner use an IPv6-safe IP-based fallback key. Exceeded requests receive `429 Too Many Requests` with
standard rate-limit headers. The export is blocked when the Redis-backed limiter is unavailable rather than bypassing the limit.

## Application Import

`POST /api/application/import` imports a ZIP archive produced by application export for the authenticated owner. Send a
`multipart/form-data` request with these fields:

| Field     | Values               | Required | Description                                  |
| --------- | -------------------- | -------- | -------------------------------------------- |
| `archive` | Application ZIP file | Yes      | JSON or CSV application export, up to 20 MB. |
| `mode`    | `preview`, `commit`  | Yes      | Validate only, or persist valid records.     |

The archive must contain the export `manifest.json` and exactly the declared resource files. Supported resources are
`categories`, `payment-methods`, `transactions`, `recurring-payments`, and `budgets`. Auth exports and attachment archives
are rejected.

Use `preview` before `commit`. The response data contains a `summary` with `received`, `created`, `skipped`, and `failed`
counts, plus `resources` with corresponding record lists. In preview mode, `created` means the record is ready to import;
in commit mode, it means the record was imported.

The endpoint preserves exported IDs for new records to keep relationships intact. Existing IDs owned by the current user are
reported as skipped; IDs owned by another user are reported as failures. Transactions and recurring payments require owned
category and payment-method IDs. Budgets require owned category IDs. A structurally valid archive with record-level problems
returns `200 OK` and reports every success or failure. Invalid archives, manifests, unsupported files, and unsupported modes
return `400 Bad Request`.
