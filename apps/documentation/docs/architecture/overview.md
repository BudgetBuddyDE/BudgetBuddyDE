---
title: System Overview
description: Components and responsibilities of the BudgetBuddy system.
icon: lucide/network
---

```text
Browser
  -> Next.js Webapp
       -> @budgetbuddyde/api
            -> Auth-Service
            -> Backend API
                 -> PostgreSQL
                 -> Redis
                 -> S3-kompatibler Speicher

MCP-Client
  -> MCP-Service
       -> Backend API
```

## Components

| Area      | Workspace               | Responsibility                            |
| --------- | ----------------------- | ----------------------------------------- |
| Webapp    | `apps/webapp`           | Next.js app, UI, Redux, and interaction   |
| Auth      | `services/auth-service` | Better Auth, sessions, sign-in, and OAuth |
| Backend   | `services/backend`      | Authenticated domain API and jobs         |
| MCP       | `services/mcp`          | MCP tools for external AI clients         |
| API       | `packages/api`          | Typed client and HTTP/Zod boundary        |
| Database  | `packages/db`           | Drizzle tables, relations, and views      |
| Types     | `packages/types`        | Shared types and schemas                  |
| Utilities | `packages/utils`        | Shared utility functions                  |

The website and documentation site are independent deliverables and are not part of the root project's npm workspace list.
