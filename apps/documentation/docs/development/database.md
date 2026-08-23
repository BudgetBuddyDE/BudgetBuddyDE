---
title: Database Development
description: Develop and migrate schema changes with Drizzle.
icon: lucide/database-zap
---

The database package provides the schema, relations, and migrations. Tables are under `packages/db/src/backend` and `packages/db/src/auth`.

## Workflow

1. Change the schema or a relation.
2. Review the generated migration.
3. Run the migration locally.
4. Run backend tests and the type check.
5. Commit the migration together with the code.

```bash
npm run db:generate --workspace @budgetbuddyde/db
npm run db:migrate --workspace @budgetbuddyde/db
npm run typecheck --workspace @budgetbuddyde/db
```

For auth schema changes, `npm run ba:schema-generate --workspace @budgetbuddyde/db` may be required first. Never accept generated changes without review.
