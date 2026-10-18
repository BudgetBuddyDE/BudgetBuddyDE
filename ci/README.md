# Project CI

`general.pipeline.yml` includes the following jobs:

- `validate-build`: validates and builds all npm workspaces on pushes to `main`.
  Every detected Git version is processed. Cogito reports pending, success,
  failure, error or abort to GitHub.
- `pull-request`: runs the same verification for pull requests targeting
  `repo.pr.branch`, and reports status through the GitHub PR resource.
- `update-dependencies`: runs every 168 hours or manually. Updates development
  dependencies and applies `npm audit fix` without forced major upgrades, then
  validates the entire project before pushing changed manifests and the lockfile.
  Only one update build runs at a time. Concurrent external pushes fail safely
  rather than forcing or rebasing the update.

Verification uses Node 24.21.0, `npm ci` and `npm run ci`: formatting, lint,
type checking, tests and builds, with dependencies orchestrated by Turborepo.
The GitHub PR resource uses the maintained cloudfoundry-community fork, published
as `cfcommunity/github-pr-resource`, pinned to image tag `0.26.0`.
The update task uses Node 24.21.0-alpine because it installs Git with `apk`.
Unresolved audit findings or failed validation prevent the dependency push.
Dependency commits do not contain `[skip ci]`, so main validation runs afterward.

There is no package versioning, Git tag creation, npm publishing or Docker
image publishing in this pipeline. `database.pipeline.yml` remains independent
and retains its backup and migration tasks.

Both pipelines use the `ci-source` Git resource to load this repository's task
definitions from `main` via `file: ci-source/ci/tasks/<file>`.
Jobs fetch `ci-source` without a trigger; existing repository, PR and schedule
resources continue to control when they run. PR verification still checks the PR
input, and builds and migrations keep their existing repository inputs and input
mappings. Task changes in a PR take effect after merging into `main`.

## Database migrations

The database migration task installs dependencies with `npm ci` at the repository
root, then runs `npm run build -- --filter=@budgetbuddyde/db`. Turborepo builds the
database workspace and its internal dependencies in dependency order so Drizzle
can load the compiled `@budgetbuddyde/core` exports from its configuration.
The task then checks and applies migrations from `packages/db`.

Changes under `packages/db/**` trigger the test migration job. If there are no
pending migrations, no database schema changes are applied.
Production migrations remain manual and only use repository versions that have
passed `update-test-database`.

## Configuration

Load `ci/vars.yml` when setting the pipeline. Supply these secrets through the
Concourse credential manager:

- `github.private_key`: repository access for `ci-source` and read/write access for dependency updates.
  Branch protection must permit this identity to push to main.
- `github.pat`: commit and pull request status access.

`git.name` and `git.email` identify automated dependency commits. No npm or GHCR
publishing credentials are required. The separate database pipeline retains its
own credentials.

## Local checks

### Validation commands

```sh
fly validate-pipeline -c ci/general.pipeline.yml -l ci/vars.yml --strict
fly validate-pipeline -c ci/database.pipeline.yml -l ci/vars.yml --strict
npm run test:ci-contracts
npm run ci
```

Pipeline validation does not run tasks or push changes. The dependency-update
task mutates dependencies and pushes only when executed through its pipeline.
