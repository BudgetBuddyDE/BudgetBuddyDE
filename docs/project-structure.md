# Project structure and monorepo conventions

## Root

The root contains the central npm workspace and Turborepo configuration:

- `package.json`: workspaces, root scripts, and shared dev dependencies
- `package-lock.json`: the monorepo's only lockfile
- `turbo.json`: global task pipeline
- `.github/workflows/ci.yml`: CI for formatting, linting, typechecking, tests, and builds
- `.github/workflows/publish-packages.yml`: publish pipeline for public packages

## Workspaces

```text
apps/       user interfaces, for example the Next.js webapp
services/   deployable backend services
packages/   reusable internal and public libraries
```

All three areas are npm workspaces. A local package can be imported by apps, services, or other packages via its package name, for example `@budgetbuddyde/types`.

## Public packages

Only these packages remain publishable for external developers:

- `@budgetbuddyde/api`
- `@budgetbuddyde/db`
- `@budgetbuddyde/types`

All other packages under `packages/*` are local monorepo building blocks and are marked with `private: true`.

## Turborepo pipeline

The root pipeline uses `dependsOn: ["^build"]` for build-related tasks. This makes Turborepo build dependency packages before an app or service is built, tested, linted, or typechecked.

Relevant outputs:

- Packages: `lib/**`
- Services: `build/**`
- Next.js webapp: `.next/**` without `.next/cache/**`

## Lockfile rule

There is only one lockfile in the root. Package-specific lockfiles must not be added because they make workspace resolution and reproducible CI installations harder.

## GitHub Actions

CI uses Turborepo directly to run workspace formatting, linting, typechecks, tests, and builds reproducibly. Builds are split into packages, services, and apps so failures can be mapped to the affected workspace type faster.

There is also a weekly dependency update workflow. It runs every Monday, can be started manually, updates npm dependencies with `npm-check-updates`, leaves internal `@budgetbuddyde/*` workspace dependencies unchanged, and automatically opens a pull request when changes are available.
