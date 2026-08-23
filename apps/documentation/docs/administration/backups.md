---
title: Backups and Restoration
description: Protect financial data and attachments against data loss.
icon: lucide/hard-drive
---

A complete BudgetBuddy backup consists of at least two parts:

1. A PostgreSQL dump for authentication and domain data.
2. An object storage backup for attachments.

Redis contains cache and rate-limit state and is normally not the source of persistent financial data. A restoration must nevertheless make Redis reachable again.

## Minimum Process

- Define a backup schedule and retention period.
- Encrypt database and object storage backups.
- Restrict access to backups.
- Test restoration regularly in an isolated environment.
- After restoration, check health checks, sign-in, API access, and attachments.

The specific backup commands depend on the PostgreSQL and S3 providers and should be versioned as part of the deployment system.
