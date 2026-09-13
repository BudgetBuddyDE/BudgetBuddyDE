---
title: System Overview
description: Components and responsibilities of the BudgetBuddy system.
icon: Network
---

```text
Browser
  -> Next.js Webapp
       -> PostgreSQL (Better Auth)
       -> @budgetbuddyde/api
            -> Backend API
                 -> PostgreSQL
                 -> Redis
                 -> S3-kompatibler Speicher

MCP-Client
  -> MCP-Service
       -> Backend API
```

## Components

| Area     | Workspace          | Responsibility                                       |
| -------- | ------------------ | ---------------------------------------------------- |
| Webapp   | `apps/webapp`      | Next.js app, Better Auth, UI, Redux, and interaction |
| Backend  | `services/backend` | Authenticated domain API and jobs                    |
| MCP      | `services/mcp`     | MCP tools for external AI clients                    |
| API      | `packages/api`     | Typed client and HTTP/Zod boundary                   |
| Database | `packages/db`      | Drizzle tables, relations, and views                 |

The website and documentation site are independent deliverables and are not part of the root project's npm workspace list.
