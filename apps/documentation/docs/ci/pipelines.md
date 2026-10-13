---
title: Pipelines
description: The current project and database pipelines, their jobs, and reusable tasks.
icon: GitBranch
---

The active definitions are `ci/app.pipeline.yml` and `ci/database.pipeline.yml`. Both load reusable task files from the checked-out repository under `ci/tasks/`. Historical `.ci/` templates are not part of this workflow.

## Project pipeline: `app.pipeline.yml`

Despite its filename, this pipeline covers the entire npm-workspace monorepo, not just the webapp. Its groups are `all`, `validation`, and `maintenance`.

### `validate-build`

- Watches `main` without a path filter and processes every detected resource version (`trigger: true`, `version: every`).
- Loads the repository and pinned `node:24.21.0` image in parallel.
- Uses `verify.task.yml` to run `npm ci` and `npm run ci` from the repository root.
- Checks formatting, lint, types, tests, and builds through the existing root scripts and Turborepo dependency graph. A failed step stops the remaining chain.
- Sends `pending`, `success`, `failure`, `error`, or `abort` to Cogito. Cogito maps aborts to GitHub's `error` state.

### `pull-request`

- Checks GitHub PRs targeting `repo.pr.branch` every minute and processes every detected PR version.
- Uses the same verification task and Node image, mapping the PR checkout to the task's `repository` input.
- Reports `pending`, `success`, `failure`, or `error` through the GitHub PR resource; aborted builds report `error`.
- Ignores CI-skip markers for PR discovery (`disable_ci_skip: true`).

Both validation jobs have `public: true`, making build information and logs public subject to the Concourse deployment's visibility settings. They do not publish artifacts or create versions.

### `update-dependencies`

- Runs every 168 hours or manually, with `serial: true` to prevent overlapping update builds.
- Uses `repository-write` to check out and push `main`. This is the same remote as `repository`, but a separate Concourse resource for writes.
- Executes `update-dependencies.task.yml` in `node:24.21.0-alpine`, installs Git with `apk`, and runs `npm ci`, `npm update -D`, `npm audit fix`, and `npm run ci`.
- Does not force major upgrades or use automatically fixing lint commands. Unresolved audit findings or failed checks stop the task before pushing.
- Stages changed root/workspace manifests and the root lockfile, and commits only if staged changes exist.
- Pushes without force or rebase. Concurrent external changes to `main` can reject the push safely.

Dependency commits use `build(dependencies): Automated update of dependencies` without `[skip ci]`, so the main repository resource detects them and starts normal validation. `git.name` and `git.email` supply the commit identity.

Credentials: `github.private_key` for read/write Git access and `github.pat` for commit and PR statuses. npm tokens, GHCR credentials, and S3 version credentials are not needed by this pipeline.

## Database pipeline: `database.pipeline.yml`

Groups are `all`, `backups`, and `database`. All database jobs have `public: false`.

- **`database-backup`**: runs every 24 hours, loads the repository to read `db-backup.task.yml`, creates a PostgreSQL custom-format dump with `pg_dump -Fc` in `postgres:17`, and uploads `backup/backup_<timestamp>.dump` to the S3 resource.
- **`update-test-database`**: triggered by changes under `<repo_path>/drizzle/**`; uses `apply-db-migration.task.yml` with Node 24.21.0 to run dependency installation, `drizzle-kit check`, and `db:migrate` against test.
- **`update-prod-database`**: uses the same migration task, restricted to repository versions that passed `update-test-database`. Its get step has no trigger, so start this job manually to apply production migrations.

The migration task currently uses the fixed directory `repository/packages/db/`. Although the pipeline passes `REPO_PATH`, the task does not consume it; configure `repo_path=packages/db` for the resource filter. The repository is filtered to migration changes, so task-only changes may not yield a new resource version.

Credentials: `github.private_key`, `s3-db-backup.bucket`, `region`, `access_key_id`, `access_key_secret`, `database.test-database-url`, `database.prod-database-url`, and `manage-database.prod-database-url`. The last value is used by the backup task; the production migration uses `database.prod-database-url`. Both must identify the intended production database.

## Related pages

- [Architecture](/ci/architecture) - resources and credential lookup.
- [Operating](/ci/operating) - configure and run these pipelines with `fly`.
