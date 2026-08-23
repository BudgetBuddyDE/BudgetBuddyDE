---
title: Deployment
description: Build and deploy BudgetBuddy to your own environment.
icon: lucide/rocket
---

## Components

| Component             | Purpose                             |
| --------------------- | ----------------------------------- |
| Webapp                | Next.js user interface              |
| Auth-Service          | Sign-in, sessions, and OAuth        |
| Backend               | Domain API and scheduled processing |
| MCP-Service           | MCP interface for AI clients        |
| PostgreSQL            | Auth and domain data                |
| Redis                 | Cache and rate-limit state          |
| S3-compatible storage | Attachments                         |

## Build

```bash
npm ci
npm run build
```

Turborepo builds dependent packages before apps and services. Deploy the generated artifacts according to the respective runtime:

- Webapp: Next.js with `npm run start` in the `apps/webapp` workspace
- Services: Node.js with `npm run start` in the respective service workspace

The documentation site is built separately with Zensical. See [Contributing to the documentation](../contributing/documentation.md) for details.

## Production Checklist

- Secrets and passwords replaced
- TLS and trusted origins configured
- Database and Redis not publicly reachable
- Rate limiting enabled
- Backups and restoration tested
- Health checks added to monitoring
- S3 bucket and access keys configured if attachments are used
