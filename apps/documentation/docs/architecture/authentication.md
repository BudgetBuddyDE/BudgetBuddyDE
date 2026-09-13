---
title: Authentication and Authorization
description: Sessions, API access, and owner isolation.
icon: ShieldCheck
---

The webapp hosts Better Auth (configuration under `apps/webapp/src/lib/auth`, API at `/api/auth/*`) and owns the `budgetbuddy_auth` tables. The webapp uses browser credentials for authenticated requests. The backend validates the session over HTTP and receives the user context before the `/api/*` routers.

## Request Boundary

- `/api/auth/*` is handled by the webapp's Better Auth handler.
- `/api/export` returns the current user's auth data export.
- `/api/me` returns the current context or session.
- Domain backend routes require an authenticated user.
- Every access to an entity is restricted to the authenticated `ownerId`.

## API Keys

API keys are intended for non-interactive clients. Treat keys like passwords, use them with minimal permissions, and revoke them immediately if compromised. Usage is described in the [API reference](/reference/authentication).

## Authorization

Authentication answers, "Who is the user?" Authorization answers, "May this user access this record?" The backend must perform both checks, including for batch and relational operations.
