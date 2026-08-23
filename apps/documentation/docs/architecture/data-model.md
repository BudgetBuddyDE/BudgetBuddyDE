---
title: Data Model
description: Domain entities and their relationships.
icon: lucide/git-branch
---

The database schema is in `packages/db/src`. The main domain entities are:

| Entity           | Purpose                               |
| ---------------- | ------------------------------------- |
| Category         | Groups income and expenses            |
| PaymentMethod    | Describes the payment source          |
| Transaction      | Single income or expense              |
| RecurringPayment | Recurring payment with scheduled run  |
| Budget           | Target amount for category and period |
| Attachment       | Linked receipt or attachment          |
| Insights         | Analytics and derived guidance        |

Authentication data is managed in the auth schema. Backend and auth tables are provided through `@budgetbuddyde/db`.

## Modeling Rules

- Domain records have an owner relationship.
- Relationships and foreign keys are defined in the DB package.
- Validation schemas for API boundaries are not derived from UI forms.
- Schema changes require a Drizzle migration.
