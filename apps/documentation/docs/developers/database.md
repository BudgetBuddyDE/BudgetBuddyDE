---
title: Database
description: Drizzle schema, ownership model, and migrations.
icon: Database
---

`packages/db` owns the PostgreSQL schema. Import through the package boundaries: `@budgetbuddyde/db/backend` for domain tables and `@budgetbuddyde/db/auth` for Better Auth tables.

## Schema layout

- `src/auth` — Better Auth tables (users, sessions, accounts, verification, API keys), generated from the Better Auth configuration.
- `src/backend` — domain tables in a dedicated PostgreSQL schema `budgetbuddy_backend`, plus enums, relations, and views.
- Backend endpoints read from views where aggregate reads are cheaper; views live alongside the tables in `src/backend`.

## Domain tables

| Table                    | Purpose                       | Notable columns                                                                                                       |
| ------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `payment_method`         | Payment methods               | `name`, `provider`, `address`, `owner_id`                                                                             |
| `category`               | Categories                    | `name`, `description`, `owner_id`                                                                                     |
| `transaction`            | Income and expenses           | `category_id`, `payment_method_id`, `processed_at`, `receiver`, `transfer_amount` (positive income, negative expense) |
| `recurring_payment`      | Scheduled payments            | `execution_plan` (`daily`, `weekly`, `biweekly`, `monthly`, `quarterly`, `yearly`), `starts_on`, `paused`             |
| `budget`                 | Monthly goals                 | `type` (`i` income, `e` expense), `name`, `budget` (amount)                                                           |
| `budget_category`        | Budget ↔ category link        | Composite primary key                                                                                                 |
| `attachment`             | Attachment metadata           | `file_name`, `file_extension`, `content_type`, `location` (unique, S3 key); IDs are UUIDv7                            |
| `transaction_attachment` | Transaction ↔ attachment link | Composite primary key                                                                                                 |

## Ownership and deletion

Every backend table carries `owner_id` referencing the Better Auth `user` table. The backend filters by `req.context.user.id` on every read and write.

Referential actions encode the data model:

| Relation                                            | On user deletion  | On parent deletion                                                 |
| --------------------------------------------------- | ----------------- | ------------------------------------------------------------------ |
| `payment_method` → user                             | cascade           | —                                                                  |
| `category` → user                                   | cascade           | —                                                                  |
| `transaction` → category / payment_method           | cascade via those | **Deleting a category or payment method deletes its transactions** |
| `recurring_payment` → category / payment_method     | cascade via those | same as transactions                                               |
| `budget_category` → budget / category               | cascade           | link rows are removed                                              |
| `attachment` → user                                 | **set null**      | —                                                                  |
| `transaction_attachment` → transaction / attachment | cascade           | link rows are removed                                              |

Because the auth and backend services share one database in the default setup, deleting a user cascades to all owned domain data. The auth service's `afterDelete` hook still carries a TODO for cross-service cleanup if you split databases.

## Migrations

Migrations run through drizzle-kit from `packages/db`:

| Script                       | Purpose                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `npm run db:generate`        | Generate a migration from schema changes                 |
| `npm run db:full-generate`   | Regenerate Better Auth tables, then generate migrations  |
| `npm run ba:schema-generate` | Regenerate `src/auth/tables.ts` from the Better Auth CLI |
| `npm run db:migrate`         | Apply pending migrations                                 |
| `npm run db:studio`          | Open Drizzle Studio                                      |

Run them from the workspace or from the root, for example:

```bash
npm run db:migrate --workspace @budgetbuddyde/db
```

The scripts read `DATABASE_URL` from `packages/db/.env`. The development `docker-compose.yml` also runs the Drizzle Gateway (port 4983) for remote Drizzle Studio access.

After schema changes, build the package so consumers see updated types:

```bash
npm run build-packages
```

## Next steps

- [Authentication](/developers/authentication)
- [API and MCP](/developers/api-and-mcp)
