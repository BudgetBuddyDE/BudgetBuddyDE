---
title: Core Primitives
description: Shared configuration, environment, and error classes.
icon: lucide/box
---

`@budgetbuddyde/core` provides dependency-free primitives that can be shared by services and packages.

## Configuration

`Config` stores immutable metadata common to a service. `BackendConfig` extends it with the HTTP port.

```ts
import {BackendConfig} from '@budgetbuddyde/core/config';

const config = new BackendConfig({
  service: 'backend',
  version: '1.0.0',
  runtime: 'production',
  port: 9000,
});
```

Use `Config` as the base class when adding a configuration type for another service.

## Environment Variables

`EnvironmentVariable` reads required and optional variables from `process.env`.

```ts
import {EnvironmentNotSetError} from '@budgetbuddyde/core/error';
import {EnvironmentVariable} from '@budgetbuddyde/core/environment';

try {
  const databaseUrl = new EnvironmentVariable('DATABASE_URL').get();
} catch (error) {
  if (error instanceof EnvironmentNotSetError) {
    // Add the missing variable before starting the service.
  }
}

const redisUrl = new EnvironmentVariable('REDIS_URL').getOptional();
```

Both accessors return an empty string unchanged. `get()` throws if the value is `undefined`, while `getOptional()`
returns `undefined`; neither accessor loads `.env` files itself.

## Errors

All core errors inherit from `CustomError`, which itself extends the native `Error` class and retains an optional `cause` for server-side logging.

| Class                    | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| `ApiClientError`         | Failure while a client communicates with an API.      |
| `BackendError`           | Unsuccessful HTTP response; also an `ApiClientError`. |
| `CacheError`             | Cache infrastructure operation failed.                |
| `DatabaseError`          | Database infrastructure operation failed.             |
| `EnvironmentNotSetError` | Required environment variable is undefined.           |

```ts
import {BackendError} from '@budgetbuddyde/core/error';
import {CustomError} from '@budgetbuddyde/core/error';

const error = new BackendError(502, 'Bad Gateway');

console.log(error instanceof CustomError); // true
console.log(error.statusCode); // 502
```

Each class has an individual Core import path. `@budgetbuddyde/core`, `@budgetbuddyde/core/config`, `@budgetbuddyde/core/error`, and `@budgetbuddyde/core/environment` remain available as optional aggregate imports.

`@budgetbuddyde/api/error` re-exports `CustomError`, `ApiClientError`, and `BackendError`. Its former `ApiError` export remains a deprecated alias for `ApiClientError`.
