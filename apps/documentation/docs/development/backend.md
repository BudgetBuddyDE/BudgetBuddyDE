---
title: Backend Development
description: Extend authenticated Express routes, services, and jobs.
icon: lucide/server
---

The backend is an Express service. Middleware for request context, logging, caching, authentication, and error handling runs before the domain routers.

## New Route

1. Define Zod payloads and a response schema.
2. Create a router under `services/backend/src/router`.
3. Check authentication and `req.context.user`.
4. Filter every query and mutation by owner.
5. Use `ApiResponse` and the existing error conventions.
6. Account for cache invalidation on mutations.
7. Add tests for success, validation errors, authentication errors, and unauthorized access.

Current domain routers are `category`, `paymentMethod`, `transaction`, `recurringPayment`, `budget`, `insights`, and `attachment`.
