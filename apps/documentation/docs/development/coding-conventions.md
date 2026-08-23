---
title: Coding Conventions
description: Shared rules for TypeScript, the backend, and the webapp.
icon: lucide/ruler
---

- Use strict TypeScript.
- Use PascalCase for React components and classes, and camelCase for functions and variables.
- Validate API boundaries with Zod.
- Always write backend access with authentication and an owner filter.
- Execute multi-step writes in Drizzle transactions.
- Preserve the existing `TResult` and `ApiResponse` conventions.
- Use Redux for persistent entity data and local React state for dialog and UI state.
- Run independent requests in parallel with `Promise.all`.
- Follow Prettier rules: two spaces, single quotes, semicolons, and 120 columns.

Introduce new abstractions only when they are actually needed more than once.
