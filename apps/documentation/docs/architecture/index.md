---
title: Architecture
description: BudgetBuddy's system boundaries, data flows, and technical decisions.
icon: Boxes
---

BudgetBuddy is a TypeScript monorepo. Domain data is processed through an authenticated backend; the webapp does not access PostgreSQL directly.

## Topics

- [System overview](/architecture/overview)
- [Data flow](/architecture/data-flow)
- [Authentication and authorization](/architecture/authentication)
- [Data model](/architecture/data-model)
- [Caching and error handling](/architecture/caching-and-errors)
- [Security](/architecture/security)
- [Architecture decisions](/architecture/decisions)

## Architecture Principles

- API boundaries are validated with Zod.
- Domain data is bound to an authenticated owner.
- Multi-step writes use database transactions.
- Apps and services consume internal packages through their public package boundaries.
- API results use the existing tuple convention, `TResult`.
