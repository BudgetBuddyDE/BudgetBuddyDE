---
title: Add a Service
icon: lucide/container
tags: [development, guide, services]
---

# Guide: Add a new service

## 1. Create the service

Create the service under `services/<name>`.

```text
services/<name>/
  package.json
  tsconfig.json
  src/server.ts
```

## 2. Configure the workspace package

The package name should follow the workspace naming scheme:

```json
{
  "name": "@budgetbuddyde/<name>",
  "version": "0.1.0",
  "private": true,
  "main": "build/src/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node build/src/server.js",
    "build": "rimraf build && tsc",
    "typecheck": "tsc --noEmit",
    "lint:check": "eslint \"src/**/*.{js,jsx,ts,tsx}\" --max-warnings=0",
    "format:check": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "test": "vitest run"
  }
}
```

## 3. Add internal packages

Use local workspaces as regular dependencies with the matching local version:

```json
{
  "dependencies": {
    "@budgetbuddyde/types": "1.1.1"
  }
}
```

npm links the local package from `packages/types` when the name and version match.

## 4. Use Turborepo

A service does not need its own `turbo.json`. The root configuration recognizes `build/**` as the output for services.

Useful commands:

```bash
npm run dev -- --filter=@budgetbuddyde/<name>
npm run build -- --filter=@budgetbuddyde/<name>
npm test -- --filter=@budgetbuddyde/<name>
```
