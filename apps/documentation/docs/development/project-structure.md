---
title: Understand the Monorepo
description: Directories, workspaces, and build dependencies.
icon: FolderTree
---

```text
apps/
  webapp/          Next.js main application
  website/         public landing page
  documentation/   Fumapress documentation
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

The root uses npm workspaces for `packages/*`, `services/*`, `apps/webapp`, `apps/documentation`, and `examples/*`. The website remains a standalone static project.

## Dependency Direction

Apps and services access shared packages by package name, such as `@budgetbuddyde/api`. Imports into the internal `src` directories of other workspaces are not intended.

## Turbo

Builds use `dependsOn: ["^build"]`. Package output is typically under `lib/`, service output under `build/`, documentation output under `dist/`, and Next output under `.next/`.
