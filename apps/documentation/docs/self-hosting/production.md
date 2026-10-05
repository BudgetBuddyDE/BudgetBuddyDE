---
title: Production
description: Go live with a self-hosted instance.
icon: ShieldCheck
---

## Production configuration

1. Set `NODE_ENV=production` for services and use HTTPS for the web app and backend. Production cookies are `Secure` and `SameSite=None`.
2. Set backend `TRUSTED_ORIGINS` to the exact web app origin(s), for example `https://app.example.com`.
3. Set backend `BASE_URL` to its complete public HTTP(S) origin without a path, query, fragment, or credentials, for example `https://backend.example.com`. Authentication is served there under `/api/auth/*`.
4. Set `NEXT_PUBLIC_BACKEND_SERVICE_HOST` before building the web app; this is its only backend/auth URL.
5. Configure `AUTH_SECRET` and `RESEND_API_KEY`, replace development infrastructure credentials, and set `DISABLE_SIGNUP=true` if registration should be closed.
6. Back up PostgreSQL and attachment storage. For an existing instance, follow [Updating](/self-hosting/updating#integrated-authentication-cutover).

## Important: cookie domain

Cross-subdomain cookies retain the existing `.budget-buddy.de` production domain in `services/backend/src/auth.ts`. For your own domain, change it to your domain (for example `.example.com`). Keep the existing cookie prefix and signing secret during migration to preserve compatible sessions.

## Build and run

```bash
npm install
npm run build
npm start
```

Turbo builds dependencies before their consumers. Run the services under a process manager such as systemd, Docker, PM2, or your hosting platform. The backend must remain running for its recurring-payment job.

## Reverse proxy

A minimal Caddy configuration routes the web app and backend, including authentication and MCP:

```text
app.example.com {
  reverse_proxy localhost:3000
}

backend.example.com {
  reverse_proxy localhost:9000
}
```

Set GitHub and Google callback registrations to `https://backend.example.com/api/auth/callback/github` and `/google`. No separate authentication process or domain is required.

## Rate limiting

| Surface                          | Limit                      |
| -------------------------------- | -------------------------- |
| Authentication (`/api/auth/*`)   | 500 requests per 5 minutes |
| Domain API                       | 300 requests per 5 minutes |
| Application export               | 4 per 15 minutes           |
| Auth export (`/api/auth/export`) | 2 per 15 minutes           |
| MCP (`/mcp`)                     | 120 requests/minute/IP     |
| API keys                         | 250 requests per 5 minutes |

Auth HTTP limits use `AUTH_REDIS_URL` when configured, otherwise cache `REDIS_URL`; domain limits use `REDIS_URL`. Auth export has its own strict limit. MCP uses cache Redis when configured and otherwise an in-memory limiter. Better Auth and MCP requests do not pass through the domain HTTP limiter. Add browser MCP client origins to `TRUSTED_ORIGINS`; clients without an Origin header remain allowed.

## Hosting integrations

The backend Dockerfile and Railway configuration include authentication and MCP. Route `/mcp` to the backend and update all MCP clients to that public URL; no separate MCP process or domain is required. Follow the [MCP cutover guide](/self-hosting/updating#integrated-mcp-cutover) to retire its previous deployment, pipeline, and monitoring. Existing hosted installations and one-click templates must replace standalone auth service environment bindings and retire that deployment during the coordinated cutover. Reverse proxies, OAuth registrations, hosting templates, and live Concourse pipelines require operator updates; repository changes do not modify those external resources.

## Next step

- [Updating](/self-hosting/updating)
- [Troubleshooting](/self-hosting/troubleshooting)
