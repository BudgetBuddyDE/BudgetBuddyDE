---
title: Self-Hosting and Operations
description: Configure, deploy, and monitor BudgetBuddy securely.
icon: lucide/server
---

BudgetBuddy consists of a Next.js webapp, an auth service, a backend, and optionally the MCP service. Operations require PostgreSQL and Redis; attachments additionally use S3-compatible storage.

## Operational Tasks

- [Deployment](deployment.md)
- [Configuration](configuration.md)
- [Environment variables](../reference/environment-variables.md)
- [Database](database.md)
- [Backups and restoration](backups.md)
- [Monitoring](monitoring.md)
- [Updates](upgrades.md)
- [Troubleshooting](troubleshooting.md)

Production environments require dedicated secrets, TLS, restricted network access, and a tested recovery process.
