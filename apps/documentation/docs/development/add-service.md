---
title: Add a New Service
description: Integrate a deployable Node.js service into the monorepo.
icon: lucide/server
---

## Workflow

1. Create a service directory under `services/<name>`.
2. Create `package.json`, the TypeScript configuration, and `src/server.ts`.
3. Add `.env.example` with documented variables.
4. Provide a health check, logging, error handling, and graceful shutdown.
5. Configure authentication and CORS for the use case.
6. Set up tests, the build, and the type check.
7. Add deployment, monitoring, and documentation navigation.

A service must document its external dependencies and required production settings. Secrets belong exclusively in runtime configuration.
