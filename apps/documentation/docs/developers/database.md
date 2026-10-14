---
title: Database
description: Drizzle schema, ownership model, and migrations.
icon: Database
---

`packages/db` owns the PostgreSQL schema. Import through the package boundaries: `@budgetbuddyde/db/backend` for domain tables and `@budgetbuddyde/db/auth` for Better Auth tables.

## Schema layout

- `src/auth` - Better Auth tables (users, sessions, accounts, verification, API keys), generated from the Better Auth configuration.
- `src/backend` - domain tables in a dedicated PostgreSQL schema `budgetbuddy_backend`, plus enums, relations, and views.
- Backend endpoints read from views where aggregate reads are cheaper; views live alongside the tables in `src/backend`.

## Domain tables

| Table                         | Purpose                              | Notable columns                                                                                                       |
| ----------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `payment_method`              | Payment methods                      | `name`, `provider`, `address`, `owner_id`                                                                             |
| `category`                    | Categories                           | `name`, `description`, `owner_id`                                                                                     |
| `transaction`                 | Income and expenses                  | `category_id`, `payment_method_id`, `processed_at`, `receiver`, `transfer_amount` (positive income, negative expense) |
| `recurring_payment`           | Scheduled payments                   | `execution_plan` (`daily`, `weekly`, `biweekly`, `monthly`, `quarterly`, `yearly`), `starts_on`, `paused`             |
| `recurring_payment_execution` | Internal automatic execution records | `owner_id`, `recurring_payment_id`, `scheduled_for` (composite primary key), `executed_at`, nullable `transaction_id` |
| `budget`                      | Monthly goals                        | `type` (`i` income, `e` expense), `name`, `budget` (amount)                                                           |
| `budget_category`             | Budget ↔ category link               | Composite primary key                                                                                                 |
| `attachment`                  | Attachment metadata                  | `file_name`, `file_extension`, `content_type`, `location` (unique, S3 key); IDs are UUIDv7                            |
| `transaction_attachment`      | Transaction ↔ attachment link        | Composite primary key                                                                                                 |

## Ownership and deletion

Domain entities, including execution records, carry `owner_id` referencing the Better Auth `user` table; join tables derive ownership from their linked entities. The backend scopes domain reads and writes to the authenticated user.

Referential actions encode the data model:

| Relation                                            | On user deletion  | On parent deletion                                                                                  |
| --------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------- |
| `payment_method` → user                             | cascade           | -                                                                                                   |
| `category` → user                                   | cascade           | -                                                                                                   |
| `transaction` → category / payment_method           | cascade via those | **Deleting a category or payment method deletes its transactions**                                  |
| `recurring_payment` → category / payment_method     | cascade via those | same as transactions                                                                                |
| `recurring_payment_execution` → user / transaction  | cascade           | deleting a transaction sets its reference to null; deleting a schedule retains the execution record |
| `budget_category` → budget / category               | cascade           | link rows are removed                                                                               |
| `attachment` → user                                 | cascade           | -                                                                                                   |
| `transaction_attachment` → transaction / attachment | cascade           | link rows are removed                                                                               |

The integrated backend uses one PostgreSQL connection for auth and domain schemas. User deletion cascades to owned domain records, including recurring-payment execution records. Storage objects still require explicit cleanup; database cascades do not delete them.

## Recurring-payment execution records

`recurring_payment_execution` identifies an automatic occurrence by owner, recurring-payment ID, and scheduled date. Mutable payment details are not part of the key: changing an amount or receiver must not permit a second automatic booking for the same date. Separate schedule IDs remain independent even when their details match.

`executeScheduledRecurringPayment` reserves the key using `INSERT ... ON CONFLICT DO NOTHING`, creates the transaction, and links it to the execution record in one Drizzle transaction. A conflict means **skipped**, not failed. Any write failure rolls back both the reservation and the booking; only successful commits leave execution records. A concurrent contender waits for the database to resolve the unique-key conflict. No distributed job lock or Redis key is required.

The transaction reference is always assigned from the new booking created for the same owner by this internal path. There is no foreign key to `recurring_payment`, so deleting a schedule does not erase its protection. Deleting a generated transaction sets `transaction_id` to null without reopening the occurrence. Records have no automatic retention cleanup and are deleted with the owner account.

The job still processes only today's dates in its configured timezone and uses the shared recurrence utilities. It reports created, skipped, and failed counts and invalidates transaction, budget, and insights caches only for owners with newly created bookings. Manual execution continues to create independent extra transactions. REST/MCP contracts and application-data archive formats are unchanged; only full database backups preserve the internal execution history.

### PostgreSQL acceptance test

The backend includes `src/__tests__/executeScheduledRecurringPayment.postgres.test.ts` for real concurrent connections, rollback, deletion rules, and independence of manual bookings. It migrates a dedicated database and uses uniquely identified test accounts, which are deleted after each test. Do not point it at an application database. The database name must start with `budgetbuddy_test_`; the suite is skipped unless `RECURRING_PAYMENT_TEST_DATABASE_URL` is supplied.

Run from the repository root against a separately provisioned test database:

```bash
RECURRING_PAYMENT_TEST_DATABASE_URL='postgres://USER:PASSWORD@localhost:5432/budgetbuddy_test_recurring' \
  npx turbo run test --filter=@budgetbuddyde/backend --force
```

Only use a disposable database: the suite applies the repository migrations and temporarily installs a failure-injection trigger. Do not run other clients or concurrent test suites against that database. Remove the database after testing. `--force` prevents a cached test result from replacing the actual database test.

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
