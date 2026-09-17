---
title: Production
description: Go live with a self-hosted instance.
icon: ShieldCheck
---

This page collects what differs between a local development setup and a public instance.

## Checklist

1. **Set `NODE_ENV=production`** for all services. This enables secure cookies, requires `TRUSTED_ORIGINS`, and enables rate limiting (where Redis is configured).
2. **Use HTTPS everywhere.** Production cookies are `Secure` and `SameSite=None`; sign-in does not work over plain HTTP.
3. **Set `TRUSTED_ORIGINS`** in the auth service and backend to your exact web app origin(s), for example `https://app.example.com`.
4. **Set `BASE_URL`** in the auth service to its public address, for example `https://auth.example.com`.
5. **Set the `NEXT_PUBLIC_*` variables** in `apps/webapp/.env` to the public auth and backend URLs, then build the web app.
6. **Replace development credentials**: the PostgreSQL and Redis passwords from `docker-compose.yml`, the `AUTH_SECRET` (generate a long random value, for example with `openssl rand -base64 32`), and the Drizzle Gateway `MASTERPASS`.
7. **Configure backups** for PostgreSQL and your object storage. See [Updating](/self-hosting/updating).
8. **Optional:** set `DISABLE_SIGNUP=true` on private instances to close public registration.

## Important: cookie domain

Production sessions use cross-subdomain cookies, and the domain is preset to `.budget-buddy.de` in `services/auth-service/src/auth.ts`. If you run the web app and auth service on your own domain, change that value to your domain (for example `.example.com`). If you skip this, sign-in can fail on custom domains.

## Build and run

```bash
npm install
npm run build
npm start
```

`npm run build` builds all workspaces in dependency order; `npm start` runs the workspace start scripts via Turbo. Run this under a process manager (systemd, Docker, PM2, or your hosting platform) so services restart automatically. The backend must run continuously because it executes the daily recurring-payment job.

## Reverse proxy

Put the web app, auth service, and backend behind a reverse proxy that terminates TLS. A minimal Caddy example:

```text
app.example.com {
  reverse_proxy localhost:3000
}

auth.example.com {
  reverse_proxy localhost:8080
}

backend.example.com {
  reverse_proxy localhost:9000
}
```

Keep the public URLs consistent with your environment files (`BASE_URL`, `NEXT_PUBLIC_*`, `TRUSTED_ORIGINS`).

## Rate limiting

The following limits are active in production:

| Service                      | Limit                               |
| ---------------------------- | ----------------------------------- |
| Auth service                 | 500 requests per 5 minutes          |
| Backend                      | 300 requests per 5 minutes          |
| Application export (backend) | 4 per 15 minutes                    |
| Auth export                  | 2 per 15 minutes                    |
| MCP service                  | 120 requests per minute             |
| API keys                     | Half the auth service request limit |

Backend and auth rate limiting require `REDIS_URL`; without Redis they stay disabled.

## One-click deploy

The repository includes a [Railway template](https://railway.com/deploy/WjE5vD?referralCode=SD-6Xm&utm_medium=integration&utm_source=template&utm_campaign=generic) that provisions the service stack. Review the generated environment variables against [Configuration](/self-hosting/configuration) before inviting users.

## Next step

- [Updating](/self-hosting/updating)
- [Troubleshooting](/self-hosting/troubleshooting)
