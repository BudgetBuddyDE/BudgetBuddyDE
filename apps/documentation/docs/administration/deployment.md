---
title: Deployment
description: Build and deploy BudgetBuddy to your own environment.
icon: Rocket
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

Set the webapp's `NEXT_PUBLIC_*` environment values before `next build`. They are embedded in browser bundles and cannot be changed by the runtime deployment environment.

The documentation site is built separately with Fumapress in static mode. See [Contributing to the documentation](/contributing/documentation) for details.

The Docker build uses the repository root as its context because the documentation is an npm workspace:

```bash
docker build -f apps/documentation/Dockerfile -t budgetbuddy-documentation .
```

The resulting NGINX image serves the generated files from `dist/public` and does not require a Node.js runtime.

## Production Checklist

- Secrets and passwords replaced
- TLS and trusted origins configured
- Database and Redis not publicly reachable
- Rate limiting enabled
- Backups and restoration tested
- Health checks added to monitoring
- S3 bucket and access keys configured if attachments are used
