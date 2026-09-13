---
title: Getting started
description: Set up the monorepo and run the development workflow.
icon: Terminal
---

## Prerequisites

- **Node.js 22 or later** and **npm 11 or later** (`packageManager: npm@11.4.2`)
- **Docker** for PostgreSQL 16, Redis 7, and the Drizzle Gateway
- A `.env` file per workspace, copied from the matching `.env.example` (see [Installation](/self-hosting/installation#3-create-environment-files))

## Setup

```bash
git clone https://github.com/BudgetBuddyDE/BudgetBuddyDE.git
cd BudgetBuddyDE
npm install
npm run build-packages
docker compose up -d
npm run dev
```

`npm run dev` runs every development task through Turbo. Use `npm run dev-services` if you only need the backend, auth service, and MCP service.

## Root commands

| Command                  | Purpose                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `npm run dev`            | All development tasks via Turbo                                                        |
| `npm run dev-services`   | Development tasks for `services/*` only                                                |
| `npm run build`          | Build all workspaces in dependency order                                               |
| `npm run build-packages` | Build `packages/*` (do this before builds and typechecks when package sources changed) |
| `npm test`               | Run all tests                                                                          |
| `npm run typecheck`      | Type-check all workspaces                                                              |
| `npm run check`          | Read-only format, lint, and type checks                                                |
| `npm run check:write`    | Apply formatting and lint fixes                                                        |
| `npm run ci`             | Full pipeline: format check, lint, typecheck, test, build                              |

Workspace-scoped commands:

```bash
npm test --workspace @budgetbuddyde/api
npx turbo run test --filter=@budgetbuddyde/api
```

## Tests

Vitest runs in every tested workspace. Root defaults are global APIs, a Node environment, and exclusions for `build/**` and `node_modules/**`.

- Package tests are usually colocated with the source under `src`.
- Service tests live in `src/__tests__` and load `.env.test` where configured.
- Web app utilities use `.spec.ts`; component tests use `.test.tsx` with Testing Library and `happy-dom`. The setup file is `apps/webapp/src/vitest.setup.ts`; Next.js navigation and image APIs are mocked globally.

Test boundaries and observable behavior — Zod validation, query serialization, `TResult` error tuples, auth context, owner isolation, cache behavior, and UI state transitions — not implementation details. Coverage is disabled by default; no threshold is enforced.

## Repository conventions

- One root `package-lock.json`. Workspaces are `packages/*`, `services/*`, `apps/webapp`, `apps/documentation`, and `examples/*`.
- Strict TypeScript. Packages emit to `lib/`, services to `build/`, the web app uses Next.js no-emit configuration.
- Prettier: 2 spaces, 120 columns, LF, single quotes, semicolons, trailing commas. ESLint import ordering is warning-level; duplicate and unused imports are errors.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Never commit secrets or generated output.

## Next steps

- [Architecture](/developers/architecture)
- [Workspaces](/developers/workspaces)
- [Adding a feature](/developers/adding-a-feature)
- [CI and pipelines](/ci/overview)
