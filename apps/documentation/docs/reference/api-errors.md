---
title: API Errors
description: Handle validation, authentication, and runtime errors.
icon: lucide/triangle-alert
---

Typical HTTP situations include:

| Status | Meaning                           |
| ------ | --------------------------------- |
| `400`  | Invalid input or validation error |
| `401`  | No valid authentication           |
| `403`  | Authenticated but not authorized  |
| `404`  | Resource not found or not visible |
| `429`  | Rate limit reached                |
| `500`  | Unexpected server error           |

The backend service responds with `ApiResponse`. The client converts the response to the `TResult` tuple form. Frontends should show the error message, offer retries only for suitable errors, and avoid exposing sensitive server details.

Client errors derive from [`CustomError`](core.md). A failed HTTP response is a `BackendError`, which is also an `ApiClientError`.

```ts
import {BackendError} from '@budgetbuddyde/api/error';

const [data, error] = await api.backend.transaction.getAll();

if (error instanceof BackendError) {
  console.error(error.statusCode, error.message);
}
```
