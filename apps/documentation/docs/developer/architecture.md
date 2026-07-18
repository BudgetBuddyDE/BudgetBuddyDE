---
title: Architecture
description: Understand BudgetBuddy system boundaries and technical data flows.
icon: lucide/network
status: active
tags: [developer, architecture]
---

# Architecture

BudgetBuddy is organized as an npm workspace monorepo containing user interfaces, deployable services, and reusable packages.

```text
apps/       user interfaces, including the web app
services/   deployable backend services
packages/   reusable internal and public libraries
```

The authentication service handles authentication concerns, while the backend exposes application functionality and uses the shared database and cache. Packages provide shared API, database, type, utility, and logging capabilities.

## Architectural responsibilities

- Apps own user interaction and presentation.
- Services own deployable runtime boundaries and API behavior.
- Packages own reusable contracts and implementation shared across workspaces.
- Database migrations define changes to persistent data and must remain compatible with the release process.

For repository conventions and Turborepo outputs, see [Project structure](project-structure.md). Service-specific contracts belong in [Services and interfaces](services.md).
