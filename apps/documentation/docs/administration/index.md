---
title: Self-Hosting and Operations
description: Configure, deploy, and monitor BudgetBuddy securely.
icon: Server
---

BudgetBuddy consists of a Next.js webapp, an auth service, a backend, and optionally the MCP service. Operations require PostgreSQL and Redis; attachments additionally use S3-compatible storage.

## Operational Tasks

- [Deployment](/administration/deployment)
- [Configuration](/administration/configuration)
- [Environment variables](/reference/environment-variables)
- [Database](/administration/database)
- [Backups and restoration](/administration/backups)
- [Monitoring](/administration/monitoring)
- [Updates](/administration/upgrades)
- [Troubleshooting](/administration/troubleshooting)

Production environments require dedicated secrets, TLS, restricted network access, and a tested recovery process.
