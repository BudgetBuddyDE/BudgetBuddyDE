---
title: Help and troubleshooting
description: Resolve common user and self-hosting problems.
icon: lucide/circle-help
status: active
tags: [user, support]
---

# Help and troubleshooting

Use the following sequence when something does not work:

1. Describe the symptom and the last action that produced it.
2. Check whether the issue affects the app, authentication, or only one self-hosted service.
3. Review the relevant logs and configuration without sharing secrets.
4. Confirm the deployed version and whether the issue started after an update.
5. Apply the smallest documented fix and verify the result.

## Common self-hosting checks

```bash
docker compose ps
docker compose logs --tail=100
docker compose config
```

Check that required environment variables are present, persistent storage is mounted, the reverse proxy forwards the correct host and ports, and the database is reachable by the backend.

## Requesting help

Include the BudgetBuddy version, deployment method, affected component, reproducible steps, relevant redacted logs, and the result of the health checks. Never include passwords, tokens, private keys, or unredacted financial data.

For source-code failures and implementation-level debugging, use the [Developer documentation](../developer/index.md).
