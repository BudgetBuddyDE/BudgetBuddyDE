---
title: Frequently Asked Questions
description: Short answers about installation, data, and development.
icon: lucide/circle-help
---

## Where Is Local Data Stored?

The local development environment uses PostgreSQL. The Docker Compose stack persists data in Docker volumes. For production backups, see [Backups and restoration](../administration/backups.md).

## Do I Need to Publish Packages Before Starting the Webapp?

No. npm workspaces link internal packages locally. Run `npm run build-packages` after changing packages.

## Why Does the Webapp Not Work Without the Auth Service?

The webapp uses the auth service for sessions and sign-in. The backend and auth service also require access to the database.

## Where Do I Report a Bug?

Use [GitHub issue tracking](https://github.com/BudgetBuddyDE/BudgetBuddyDE/issues) and describe the reproduction steps, expected behavior, and actual behavior.
