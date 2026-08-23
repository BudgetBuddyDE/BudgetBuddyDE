---
title: API Overview
description: Backend API resources, URLs, filters, and response format.
icon: lucide/terminal
---

## Basics

The backend API is available under `/api`. The base URL is configured in the webapp through `NEXT_PUBLIC_BACKEND_SERVICE_HOST`.

## Resources

| Resource           | Path                    |
| ------------------ | ----------------------- |
| Categories         | `/api/category`         |
| Payment methods    | `/api/paymentMethod`    |
| Transactions       | `/api/transaction`      |
| Recurring payments | `/api/recurringPayment` |
| Budgets            | `/api/budget`           |
| Insights           | `/api/insights`         |
| Attachments        | `/api/attachment`       |
| User context       | `/api/me`               |

The specific methods and payloads are defined in `packages/api` and the backend routers. Prefer the typed client over manual HTTP calls.

## Response Format

The client uses `TResult`: either `[data, null]` or `[null, error]`. Do not introduce a second error convention.

## Batch and Filters

Batch operations are limited to 100 records. Query filters are serialized by the client; the backend service validates and interprets them.
