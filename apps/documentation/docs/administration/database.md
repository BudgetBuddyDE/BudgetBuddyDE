---
title: Database
description: Operate PostgreSQL, the Drizzle schema, and migrations.
icon: lucide/database
---

BudgetBuddy uses PostgreSQL 16. The schema is managed with Drizzle ORM and Drizzle Kit. The `@budgetbuddyde/db` package contains separate areas for authentication and domain data.

## Local Database

```bash
docker compose up -d db drizzle_db_gateway
```

The application's connection values must match the local PostgreSQL container. Pay particular attention to the host and port: addresses inside the container and addresses reachable from the host may differ.

## Schema Commands

```bash
npm run db:generate --workspace @budgetbuddyde/db
npm run db:migrate --workspace @budgetbuddyde/db
npm run db:studio --workspace @budgetbuddyde/db
```

After schema changes, migrations must be reviewed, versioned, and tested before production deployment. `db:full-generate` is also available for changes to the Better Auth schema.

## Principles

- Never try migrations against the only production copy.
- Create a backup before migrations.
- Owner-scoped queries and writes must preserve the ownership boundary.
- Do not publish database credentials in logs or issues.
