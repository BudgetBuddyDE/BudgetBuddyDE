---
title: Project structure
description: Repository layout, workspaces, and build conventions.
icon: lucide/folder-tree
status: active
tags: [developer, conventions]
---

# Project structure

The repository contains one npm workspace and one root lockfile. Apps, services, and packages are built through Turborepo.

## Workspaces

```text
apps/       user interfaces
services/   deployable backend services
packages/   reusable internal and public libraries
```

Internal packages are imported by workspace package name, for example `@budgetbuddyde/types`. The public packages are `@budgetbuddyde/api`, `@budgetbuddyde/db`, and `@budgetbuddyde/types`; other packages are private monorepo building blocks.

## Build outputs

- Packages: `lib/**`
- Services: `build/**`
- Next.js web app: `.next/**`, excluding `.next/cache/**`

Turborepo builds dependency packages before dependent apps and services. Package-specific lockfiles must not be added.

The existing detailed reference remains available in [Development project structure](../development/project-structure.md) while the documentation is migrated.
