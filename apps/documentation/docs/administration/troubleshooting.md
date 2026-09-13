---
title: Troubleshooting
description: Resolve common problems in local and production environments.
icon: Wrench
---

## Webapp Cannot Reach Services

- Check `NEXT_PUBLIC_BACKEND_SERVICE_HOST`.
- Check the webapp's Better Auth database variables (`DATABASE_URL`, `AUTH_SECRET`) and whether the backend is running.
- Check the CORS and `TRUSTED_ORIGINS` configuration.
- Check the browser console and service logs.

## Database Connection Fails

- Check `DATABASE_URL`.
- Check whether PostgreSQL is running and the port is correct.
- Check network access from the relevant container.
- Check whether migrations have been run.

## Redis Is Unreachable

- Check `REDIS_URL` and the password.
- Check the container status with `docker compose ps`.
- Check whether the service is impaired only because of caching or rate limiting.

## Build Uses Stale Package Output

```bash
npm run build-packages
npm run build
```

Turborepo caches results. If the cache is in an unexpected state, remove the local `.turbo` cache and repeat the build.
