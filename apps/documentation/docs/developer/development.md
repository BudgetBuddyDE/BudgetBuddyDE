---
title: Development environment
description: Set up and run the BudgetBuddy monorepo locally.
icon: lucide/terminal
status: active
tags: [developer, development]
---

# Development environment

BudgetBuddyDE is an npm-based monorepo. Apps, services, and packages are linked through npm workspaces, so local builds use local package versions.

## Prerequisites

- Node.js 22 or newer
- npm 11.x matching `package.json`
- Git
- Docker and Docker Compose
- Required `.env` files for the web app and services

## Setup

```bash
git clone git@github.com/BudgetBuddyDE/BudgetBuddyDE.git
cd BudgetBuddyDE
npm install
npm run build-packages
docker compose up -d
npm run dev
```

Copy the appropriate `.env.example` file to `.env` in each workspace that requires configuration. Do not commit secrets.

## Common commands

```bash
npm run dev
npm run dev-services
npm run format:check
npm run lint:check
npm run typecheck
npm test
npm run build
npm run check
```

The complete local CI sequence is documented in [Quality and automation](quality.md). For workspace responsibilities and build outputs, see [Project structure](project-structure.md).

## Troubleshooting

- Use Node.js 22 or newer.
- If Turbo returns stale results, clear `.turbo` and rerun the task.
- Confirm Docker is running and database ports are available.
- When changing an internal package version, update its consumers and regenerate the root lockfile with `npm install --package-lock-only --ignore-scripts`.
