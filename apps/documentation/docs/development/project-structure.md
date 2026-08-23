---
title: Understand the Monorepo
description: Directories, workspaces, and build dependencies.
icon: lucide/folder-tree
---

```text
apps/
  webapp/          Next.js main application
  website/         public landing page
  documentation/   Zensical documentation
services/
  auth-service/    Better Auth service
  backend/         domain Express API
  mcp/             MCP service
packages/
  api/             typed API client
  db/              Drizzle schema and database access
  types/           shared types and Zod schemas
  utils/            shared utilities
  logger/           existing, deprecated logging helper
examples/
  api-key-client/  API key example
```

The root uses npm workspaces for `packages/*`, `services/*`, `apps/webapp`, and `examples/*`. The documentation and website projects have their own build configurations.

## Dependency Direction

Apps and services access shared packages by package name, such as `@budgetbuddyde/types`. Imports into the internal `src` directories of other workspaces are not intended.

## Turbo

Builds use `dependsOn: ["^build"]`. Package output is typically under `lib/`, service output under `build/`, and Next output under `.next/`.
