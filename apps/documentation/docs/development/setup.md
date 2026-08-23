---
title: Development Setup
description: Local development, quality checks, and workspace commands.
icon: lucide/terminal-square
---

The complete initial installation is described in [Set up the development environment](../getting-started/development.md). This page is the daily reference.

## Common Commands

```bash
npm run dev
npm run dev-services
npm run build-packages
npm run format:check
npm run lint:check
npm run typecheck
npm test
npm run build
```

## Run a Specific Workspace

```bash
npm test --workspace @budgetbuddyde/api
npm run typecheck --workspace @budgetbuddyde/webapp
npm run build --workspace @budgetbuddyde/backend
```

Turborepo accounts for workspace dependencies. Use npm and the existing Turbo scripts; do not add another package manager.
