---
title: Add a New Package
description: Create an internal or publishable workspace package.
icon: lucide/package-plus
---

## Workflow

1. Create a package directory under `packages/<name>`.
2. Add `package.json`, `tsconfig.json`, and `src/index.ts`.
3. Define the name, visibility, and dependencies.
4. Expose exports only through the public package boundary.
5. Update the root lockfile.
6. Run the build, type check, lint, and tests.

Internal packages are referenced by their npm workspace name. When changing the version of internal packages, update consumers:

```bash
npm install --package-lock-only --ignore-scripts
```

A package should be publishable only when its API, license, README, and release process are defined.
