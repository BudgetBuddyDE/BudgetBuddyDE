---
title: Architecture
description: BudgetBuddy's system boundaries, data flows, and technical decisions.
icon: lucide/boxes
---

BudgetBuddy is a TypeScript monorepo. Domain data is processed through an authenticated backend; the webapp does not access PostgreSQL directly.

## Topics

- [System overview](overview.md)
- [Data flow](data-flow.md)
- [Authentication and authorization](authentication.md)
- [Data model](data-model.md)
- [Caching and error handling](caching-and-errors.md)
- [Security](security.md)
- [Architecture decisions](decisions/index.md)

## Architecture Principles

- API boundaries are validated with Zod.
- Domain data is bound to an authenticated owner.
- Multi-step writes use database transactions.
- Apps and services consume internal packages through their public package boundaries.
- API results use the existing tuple convention, `TResult`.
