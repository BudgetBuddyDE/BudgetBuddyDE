---
title: Caching and Error Handling
description: Cache lifecycle and standardized error responses.
icon: lucide/layers-2
---

## Cache

The backend checks read responses through middleware. After mutations, affected keys are invalidated so subsequent requests do not return stale data.

The cache must not weaken ownership boundaries. Cache keys must therefore include all relevant identity and query components.

## Errors

The API uses standardized `ApiResponse` values. The TypeScript client represents results as tuples:

```ts
type TResult<T, E> = [T, null] | [null, E];
```

Validation errors are returned as HTTP error responses with structured data. Services and the frontend should not introduce parallel, ad hoc error formats.
