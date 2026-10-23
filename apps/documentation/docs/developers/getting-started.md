---
title: Getting started
description: Set up the monorepo and run the development workflow.
icon: Terminal
---

## Prerequisites

- **Node.js 24.21.0** and **pnpm as pinned by `packageManager`**
- **Docker** for PostgreSQL 16, Redis 7, and the Drizzle Gateway
- A `.env` file per workspace, copied from the matching `.env.example` (see [Installation](/self-hosting/installation#3-create-environment-files))

## Setup

```bash
git clone https://github.com/BudgetBuddyDE/BudgetBuddyDE.git
cd BudgetBuddyDE
pnpm install --frozen-lockfile
pnpm run build-packages
docker compose up -d
pnpm run dev
```

`pnpm run dev` runs every development task through Turbo. Use `pnpm run dev-services` if you only need the backend, including its authentication and MCP endpoints.

## Root commands

| Command                   | Purpose                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm run dev`            | All development tasks via Turbo                                                        |
| `pnpm run dev-services`   | Development tasks for `services/*` only                                                |
| `pnpm run build`          | Build all workspaces in dependency order                                               |
| `pnpm run build-packages` | Build `packages/*` (do this before builds and typechecks when package sources changed) |
| `pnpm test`               | Run all tests                                                                          |
| `pnpm run typecheck`      | Type-check all workspaces                                                              |
| `pnpm run check`          | Read-only format, lint, and type checks                                                |
| `pnpm run check:write`    | Apply formatting and lint fixes                                                        |
| `pnpm run ci`             | Full pipeline: format check, lint, typecheck, test, build                              |

Workspace-scoped commands:

```bash
pnpm --filter @budgetbuddyde/api test
pnpm exec turbo run test --filter=@budgetbuddyde/api
```

## Vite+ toolchain

Vite+ 1.3.0 and pnpm 11.28.6 are pinned locally; a global Vite+ installation is optional. Use `pnpm install --frozen-lockfile` to install dependencies, `pnpm exec vp check` for Oxfmt/Oxlint, and `pnpm run typecheck` for the existing workspace TypeScript checks. The bundled TS7 checker is not enabled because the CommonJS packages still use Node10 module resolution.

`pnpm exec vp test` selects the workspace test configurations. The webapp runs in a separate execution group with six workers. `pnpm test` retains Turbo dependency builds, prechecks, and backend coverage enforcement.

Built-ins do not replace scripts: `vp dev` starts Vite, while `vp run dev` runs this repository's Turbo development script, including Next.js and the backend. Likewise, use `vp run build` for Next.js, Fumapress and CommonJS library builds. Libraries keep their `tsc` output layouts and exports; they do not use `vp pack`.

`vp hooks` manages the Git dispatcher and `vp staged` applies the root staged-file rules from `vite.config.ts` before the existing Turbo typecheck. Generated dispatcher files live under `.vite-hooks/_`; the project hook is `.vite-hooks/pre-commit`. Shared formatting/lint rules live in root `vite.config.ts`; shared test transforms and defaults live in `vite.shared.ts`.

## Test conventions

Vitest runs in every tested workspace. Root defaults are global APIs, a Node environment, and exclusions for `build/**` and `node_modules/**`.

- Package tests are usually colocated with the source under `src`.
- Service tests live in `src/__tests__` and load `.env.test` where configured.
- Web app utilities use `.spec.ts`; component tests use `.test.tsx` with Testing Library and `happy-dom`. The setup file is `apps/webapp/src/vitest.setup.ts`; Next.js navigation and image APIs are mocked globally.

Test boundaries and observable behavior - Zod validation, query serialization, `TResult` error tuples, auth context, owner isolation, cache behavior, and UI state transitions - not implementation details. Backend unit tests enforce 80% coverage for statements, branches, functions, and lines, with mocked database, Redis, email, storage, and HTTP boundaries. Other workspaces retain their existing coverage defaults.

## Repository conventions

- One root `pnpm-lock.yaml`. Workspaces are `packages/*`, `services/*`, `apps/webapp`, `apps/documentation`, and `examples/*`.
- Strict TypeScript. Packages emit to `lib/`, services to `build/`, the web app uses Next.js no-emit configuration.
- Oxfmt: 2 spaces, 120 columns, LF, single quotes, semicolons, trailing commas. Oxlint retains import ordering through the existing JS plugin; duplicate and unused imports are errors.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Never commit secrets or generated output.

## Next steps

- [Vite+ migration decisions](/developers/vite-plus-migration)

- [Architecture](/developers/architecture)
- [Workspaces](/developers/workspaces)
- [Adding a feature](/developers/adding-a-feature)
- [CI and pipelines](/ci/overview)
