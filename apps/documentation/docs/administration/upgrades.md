---
title: Updates and Rollbacks
description: Roll out new versions in a controlled manner.
icon: lucide/refresh-cw
---

## Update Process

1. Read the changelog and relevant migration notes.
2. Create database and object storage backups.
3. Test the build and migration in a staging environment.
4. Update the application and services together with the required packages.
5. Run migrations.
6. Check health checks, sign-in, transactions, and attachments.
7. Monitor logs and error rates.

## Rollback

A code rollback is not always sufficient for incompatible database migrations that have already been run. Document the recovery path before every migration and restore the database in an isolated environment if necessary.
