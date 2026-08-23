---
title: Set Up the Development Environment
description: Install and start BudgetBuddy locally.
icon: lucide/terminal
---

## Prerequisites

- Node.js 22 or later
- npm 11.x, matching `packageManager` in `package.json`
- Git
- Docker with a running Docker daemon

## Prepare the Repository

```bash
git clone git@github.com:BudgetBuddyDE/BudgetBuddyDE.git
cd BudgetBuddyDE
npm install
npm run build-packages
```

The repository uses npm workspaces. Dependencies are installed once at the root; do not create additional lockfiles.

## Start the Infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, and the Drizzle gateway. The defaults are intended only for local development and must be changed in production environments.

## Create Environment Variables

Copy the respective example files in the workspace directories:

```text
apps/webapp/.env.example -> apps/webapp/.env.local
services/auth-service/.env.example -> services/auth-service/.env
services/backend/.env.example -> services/backend/.env
services/mcp/.env.example -> services/mcp/.env
packages/db/.env.example -> packages/db/.env
```

The variables are documented in the [environment variable reference](../reference/environment-variables.md). Secrets do not belong in Git.

## Start

```bash
npm run dev
```

To start only the services, use:

```bash
npm run dev-services
```

## Verify the Installation

```bash
npm run format:check
npm run lint:check
npm run typecheck
npm test
npm run build
```

If you encounter problems, see [Troubleshooting](../administration/troubleshooting.md).
