---
title: Pipelines
description: The current project and database pipelines, their jobs, and reusable tasks.
icon: GitBranch
---

The active definitions are `ci/general.pipeline.yml` and `ci/database.pipeline.yml`. Normal project and database migration jobs load reusable task files through `ci-source` from `main`; the scheduled database backup defines its task inline. AI review tasks and cleanup hooks load from the pinned external AI Code Buddy Provider source. The historical `.ci/` templates have been removed.

## Project pipeline: `general.pipeline.yml`

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

### `pull-request-ai-review`

- Processes every detected PR head targeting `main`, serially and independently of normal verification, using the maintained `cfcommunity/github-pr-resource:0.26.0` and `integration_tool: checkout`.
- Fetches `ai-code-buddy-source` and `ai-code-buddy-image` without triggers, pinned by Provider commit and matching registry digest in `ai-code-buddy-settings`.
- Verifies the actual task-source commit against image metadata without credentials before calling the shared preparation, analysis and publication tasks. It does not build an image locally.
- Reads trusted `.pr_agent.toml` from the fixed target commit. PR code is never executed by operational review tasks. Only analysis receives the LiteLLM key; GitHub/S3 credentials stay outside that task.
- Limits analysis to ten minutes and the lifecycle to fifteen, with at most three chunks per tool. Publishes a summary, up to fifteen inline findings/suggestions and the exact-head `ai-review/gate` check.
- A complete `changes_required` produces a successful job and failed GitHub check. Technical or incomplete analyses fail the job and gate; cleanup publishes validated partial findings with “Analyse unvollständig”. Superseded or aborted runs grant no approval and post no new findings.
- Reuses complete positive and negative results from S3 without repeated model calls or duplicate comments. Partial results are not cached.

Provider updates do not automatically upgrade this Consumer. Publish and verify a
release first, then update both pins together and run live acceptance. Preserve
existing CI requirements and require the App-bound gate plus up-to-date branches.

### `update-dependencies`

- Runs every 168 hours or manually, with `serial: true` to prevent overlapping update builds.
- Uses `repository-write` to check out and push `main`. This is the same remote as `repository`, but a separate Concourse resource for writes.
- Executes `update-dependencies.task.yml` in `node:24.21.0-alpine`, installs Git with `apk`, and runs `npm ci`, `npm update -D`, `npm audit fix`, and `npm run ci`.
- Does not force major upgrades or use automatically fixing lint commands. Unresolved audit findings or failed checks stop the task before pushing.
- Stages changed root/workspace manifests and the root lockfile, and commits only if staged changes exist.
- Pushes without force or rebase. Concurrent external changes to `main` can reject the push safely.

Dependency commits use `build(dependencies): Automated update of dependencies` without `[skip ci]`, so the main repository resource detects them and starts normal validation. `git.name` and `git.email` supply the commit identity.

Credentials: `github.private_key` for read/write Git access and `github.pat` for commit and PR statuses. npm tokens, GHCR publishing credentials, and S3 version credentials are not needed. AI review uses its separate App, LiteLLM, private result-cache and read-only Provider-source credentials.

## Database pipeline: `database.pipeline.yml`

Groups are `all`, `backups`, and `database`. All database jobs have `public: false`.

- **`database-backup`**: runs every 24 hours from the timer, independently of the migration repository resource. Its inline task creates a PostgreSQL custom-format dump with `pg_dump -Fc` in `postgres:17` and uploads `backup/backup_<timestamp>.dump` to the S3 resource.
- **`update-test-database`**: triggered by changes under `packages/db/**`; uses `apply-db-migration.task.yml` with Node 24.21.0 to run dependency installation, build the database workspace and its dependencies through Turborepo, then run `drizzle-kit check` and `db:migrate` against test.
- **`update-prod-database`**: uses the same migration task, restricted to repository versions that passed `update-test-database`. Its get step has no trigger, so start this job manually to apply production migrations.

Migration task definitions are loaded independently through `ci-source` from
`main`. The repository resource remains filtered to database changes; task-only
changes do not trigger a migration.

Credentials: `github.private_key`, `s3-db-backup.bucket`, `region`, `access_key_id`,
`access_key_secret`, `database.test-database-url`, and
`database.prod-database-url`. Backups and production migrations use the same
production URL and must identify the intended database.

## Related pages

- [Architecture](/ci/architecture) - resources and credential lookup.
- [Operating](/ci/operating) - configure and run these pipelines with `fly`.
