---
title: Authentication
description: Better Auth setup, sessions, cookies, and API keys.
icon: KeySquare
---

Authentication lives in `services/backend`, with Better Auth exposed under `/api/auth/*`. The configuration is centralized in `src/auth.ts` with `src/config.ts` supplying environment values. The web app uses its public backend URL for both authentication and domain requests.

## Flows

- **Email and password** - enabled, with automatic sign-in after registration. An email verification link is sent on sign-up and sign-in (`requireEmailVerification` is off, so unverified users can still use the app).
- **Social sign-in** - GitHub and Google. A provider is enabled only when both its client ID and secret are configured.
- **Password reset** - via Resend email; resetting revokes all sessions.
- **Email change** - enabled with mandatory verification: the confirmation link goes to the current email address and the change only applies after it is opened.
- **Account deletion** - enabled with a final confirmation email before deletion.

Account linking is enabled for `email-password`, GitHub, and Google. Unlinking the last credential is not allowed.

## Sessions

- Sessions are stored in Redis when `AUTH_REDIS_URL` is configured (`secondaryStorage`, `AUTH_REDIS_DB` defaults to `0`); otherwise they live in PostgreSQL. This connection is independent of backend cache Redis (`REDIS_URL`, `REDIS_DB` defaults to `1`).
- A cookie cache with a 30-minute max age reduces session lookups.
- The cookie prefix is `budget-buddy`.

## Cookies

- In production, cookies are secure and `SameSite=None`.
- Cross-subdomain cookies are enabled: the domain is `.budget-buddy.de` in production and `localhost` in development.
- **Self-hosters:** the production domain is hardcoded. Change it in `services/backend/src/auth.ts` when running on your own domain.

## API keys

The Better Auth API-key plugin (`@better-auth/api-key`) is configured with:

- Prefix `bb-` and required key names.
- Session usage enabled (`enableSessionForAPIKeys`), so keys can be sent to the backend as `x-api-key` and to the MCP service as `x-api-key` or `Authorization: Bearer`.
- A rate limit of half the authentication request limit over the same window.
- Permissions are currently an empty default set with a TODO for scoped permissions, meaning keys act with full account access.

Keys are created and revoked in the web app under Settings → API keys; key metadata is included in auth data exports, but secret values never are.

## How the backend validates requests

`services/backend` calls the local `auth.api.getSession` with incoming cookies or API keys and records the result in the request context. There is no HTTP round trip or separate auth process:

- `req.context.user` / `req.context.session` for authorized routes.

Backend handlers must check `req.context.user` and return a 401 `ApiResponse` when it is missing. CORS allows `Content-Type`, `Authorization`, `X-User-Id`, and `X-API-Key` headers with credentials.

## Auth data export

`GET /api/auth/export?format=json|csv` returns the existing ZIP archive of user, session, account, and API-key metadata. Secret API-key values and account tokens are excluded. The export route is mounted before the Better Auth catch-all, requires authentication, and is never response-cached. `/api/me` remains the standardized domain request-context endpoint.

## Development extras

- The Better Auth OpenAPI plugin is enabled in development only.
- `DISABLE_CSRF_CHECK` and `DISABLE_SIGNUP` environment flags map to the respective Better Auth options.

## Next steps

- [API and MCP](/developers/api-and-mcp)
- [Database](/developers/database)
