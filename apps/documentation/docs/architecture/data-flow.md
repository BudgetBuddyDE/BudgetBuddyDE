---
title: Data Flow
description: How an authenticated request moves through BudgetBuddy.
icon: lucide/arrow-right-left
---

## Read Request

1. The webapp calls the shared API client.
2. The client serializes query parameters and sends browser credentials.
3. Middleware sets the request context, logs the request, and checks the cache.
4. Authentication middleware provides `req.context.user`.
5. The router validates parameters and filters the query by `ownerId`.
6. Drizzle reads PostgreSQL data.
7. The backend service returns a standardized `ApiResponse`.

## Write Request

After a mutation, affected cache entries are invalidated. Deleting a category cascades to its transactions, recurring payments, and budget-category links. Deleting a payment method cascades to its transactions and recurring payments. Both operations also invalidate the transaction, recurring-payment, and budget caches for the same owner. Multiple dependent writes are executed in a transaction. Batch operations must check ownership of all affected records and are limited to 100 records.

## Frontend State

Persistent entity data is updated or reloaded in Redux after mutations. Dialog and batch state remains local to components.
