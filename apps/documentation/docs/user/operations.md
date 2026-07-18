---
title: Operations and maintenance
description: Keep a self-hosted BudgetBuddy instance healthy and secure.
icon: lucide/activity
status: active
tags: [user, hosting, operations]
---

# Operations and maintenance

This page is the operator checklist for a running instance.

## Health checks

- Confirm that the web app is reachable through the public URL.
- Confirm that authentication and the backend respond normally.
- Check `docker compose ps` after deployment or restart.
- Review recent service logs after configuration or version changes.

## Logs

Use the service logs to diagnose a failure without exposing secrets or financial data:

```bash
docker compose logs --tail=100 auth-service
docker compose logs --tail=100 backend
```

The exact service names depend on the Compose configuration. Remove or redact tokens, credentials, and personal data before sharing logs.

## Backups and updates

Back up persistent data before updates, migrations, or infrastructure changes. Keep at least one backup outside the host and periodically verify that it can be restored. Follow the [self-hosting guide](self-hosting.md) for deployment and recovery precautions.

## Security and privacy

- Keep environment files and secrets out of version control.
- Restrict access to the host, database, and monitoring endpoints.
- Use HTTPS for public access.
- Apply updates promptly after reviewing their migration notes.
- Delete exported data and backups according to your retention policy.

Technical instrumentation and incident response are documented for developers in [Observability](../developer/observability.md).
