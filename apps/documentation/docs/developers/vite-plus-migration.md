---
title: Vite+ migration
description: Toolchain migration decisions and compatibility review.
---

## Scope

The repository uses Vite+ 1.3.0 (Vite 8.3.4, Vitest 5.0.5, Oxlint and Oxfmt), npm workspaces and the existing Turbo dependency graph. Next.js and Fumapress keep their framework build commands. Libraries retain CommonJS JavaScript, declarations, subpath exports and `tsc` builds; no tsdown/`vp pack` configuration or compatibility defaults were introduced.

Vitest was upgraded from 3 to 4.1.12 before running the Vite+ migrator. Explicit Node/Intl types, constructor-safe mock factories and a targeted TypeScript decorator transform preserve existing behavior. Oxc does not lower standard decorators. The webapp uses two fork workers because VM workers exhausted Windows file handles loading MUI icons. Each Turbo runner gets its own filesystem transform cache.

## Migration report review

All 37 review findings were inspected:

- Fifteen text-content findings in six webapp test files use happy-dom and Testing Library jest-dom, not browser-mode assertions. Their matchers remain unchanged.
- The eight merged-config findings and seven nested-project findings use the shared `vite.shared.ts` config. It deliberately contains no project list; only root `vite.config.ts` enumerates workspace configs, preventing recursive inheritance and duplicated setup files.
- The two global-API findings belong to backend Vitest tests with `globals: true`. Their constructor mock factories return the same service objects and retain existing ownership assertions.
- The two class-mock findings return object mocks and do not depend on prototype methods or `instanceof`. Constructor-safe function implementations are retained.
- The three coverage-pattern findings retain the configured source inclusion and exclusions. V5 measures 63 backend files, including eight `src/lib/**` files previously excluded accidentally by v4's absolute-path `contains` matching of `lib/**`. This broadens coverage rather than dropping files. All four 80% thresholds remain enforced.

No browser-mode or benchmark suites are configured. The documentation Mermaid tests use Node's test runner, not Vitest, and are not part of the root Vitest projects.

## Lint and build compatibility

The migrated rules retain the existing policy rather than opt into additional correctness or type-aware rules. Import ordering and the Next.js relative-location rule use their existing JavaScript plugins; TypeScript-aware unused-variable checks avoid false positives for function signatures and enum members. Strict-mode redundant `no-dupe-args` and `no-octal` rules need no replacement.

Workspace `tsc` checks remain mandatory. The bundled TS7 checker removes Node10 resolution, and switching the backend directly to Node16 resolution produces split Drizzle ESM/CommonJS types. The backend maps only `vite-plus/test` to the same pinned upstream Vitest declarations so application output is unchanged. A broader module-resolution migration is deferred, not hidden by weakening assertions or build checks.

Vite+ hooks replace Husky and direct lint-staged integration; npm's package-manager pin remains unchanged. Staged source files run formatting and lint fixes, while staged JSON/CSS/Markdown run formatting only. The project hook runs `vp staged` followed by the existing Turbo typecheck and retains the CI bypass. `vp hooks status` confirms the dispatcher is active under `.vite-hooks/_`. Vite/Vitest overrides align transitive toolchain consumers; React/React DOM overrides and root peer providers prevent Testing Library from loading a different React copy. The Waku override remains necessary for Fumapress.

## Validation

### Compatibility cleanup

- `vite.config.ts`: removed the generated `clearMocks: false` override; it duplicated `baseConfig.test.clearMocks` and workspace configs do not inherit the root. The first isolated trial overlapped a Turbo dependency rebuild and lost one emitted logger file, so that run was inconclusive. The subsequent full run with both accepted removals passes the original test set.
- `vite.shared.ts` (formerly `vitest.config.ts`): removed the added `clearMocks: false` setting and its generated comment. The effective value is now Vitest 5's `true` in all projects. `vp test run --maxWorkers=2` passes 1,214 tests with the same 16 skips; `vp -C services/backend test run --coverage --maxWorkers=2` passes 653 tests with the same 15 skips and unchanged coverage. No application or test edits were needed for removal.

No generated v4 compatibility settings remain. There were no inline-project, browser-locator, Temporal or glob-threshold compatibility additions, and no tsdown compatibility candidates. Existing test setup and coverage thresholds are unchanged.

The migrated suite contains 1,230 tests: 1,214 passed and the same 16 were skipped (15 database integration cases and one webapp case). Backend coverage is 91.58% statements, 83.83% branches, 92.90% functions and 92.25% lines. Documentation's two Node-runner Mermaid tests also pass. Package export targets/declarations and representative CommonJS imports were checked against emitted files.

Existing webapp tests still print download-navigation `URL` errors and a refused localhost backend request; these were also present in the Vitest 4 baseline and do not fail the suite. Live PostgreSQL integration and Docker/browser smoke tests require a separate environment. No snapshots or assertions were relaxed.
