---
title: Authentication and Authorization
description: Sessions, API access, and owner isolation.
icon: lucide/shield-check
---

The auth service is based on Better Auth. The webapp uses browser credentials for authenticated requests. The backend receives the user context before the `/api/*` routers.

## Request Boundary

- `/api/auth/*` is handled by the auth service.
- `/api/me` returns the current context or session.
- Domain backend routes require an authenticated user.
- Every access to an entity is restricted to the authenticated `ownerId`.

## API Keys

API keys are intended for non-interactive clients. Treat keys like passwords, use them with minimal permissions, and revoke them immediately if compromised. Usage is described in the [API reference](../reference/authentication.md).

## Authorization

Authentication answers, "Who is the user?" Authorization answers, "May this user access this record?" The backend must perform both checks, including for batch and relational operations.
