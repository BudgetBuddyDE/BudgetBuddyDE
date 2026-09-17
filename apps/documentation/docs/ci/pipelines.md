---
title: Pipelines
description: The four pipeline templates, their jobs, and their credentials.
icon: GitBranch
---

All pipelines live in `ci/pipelines/` as reusable templates. Per-workspace values are passed as variables when the pipeline is created; credentials resolve from Vault at runtime (see [Architecture](/ci/architecture)).

| Template                           | Pipelines                        | Publishes                       |
| ---------------------------------- | -------------------------------- | ------------------------------- |
| `publish-service.pipeline.yml`     | `auth-service`, `backend`, `mcp` | Git tags & release commits      |
| `publish-npm-package.pipeline.yml` | `db`, `api`, `core`, `logger`    | npm packages                    |
| `test-webapp.pipeline.yml`         | `webapp`                         | Nothing; validation only        |
| `manage-database.pipeline.yml`     | `manage-database`                | Migrations and daily S3 backups |

## Shared conventions

- **Job groups** — every pipeline (except `manage-database`) groups its jobs into `all`, `build`, and `release` for the Concourse UI.
- **Templates** — `repo_path`, `service`, and `service_name` are passed with `fly -v`; each workspace gets its own pipeline from the same file.
- **Versioning** — versions are stored in S3 through a semver resource. The build job produces release candidates (`0.0.0-rc.0`, bumped with the `rc` pre-release), and the release jobs bump the final version.
- **Release commits** — release jobs run `npm version`, commit the change as `chore(release): Release <service>-v<version>`, create an annotated Git tag, and push back to the repository with `rebase`.
- **Commit statuses** — `publish-service` and `publish-npm-package` report `pending`, `success`, `failure`, `error`, and `abort` to the GitHub commit via cogito.
- **Failure alerts** — the service and package templates post to Discord when a release job fails.
- **Task images** — build tasks run in the `node:lts` image; database tasks use `postgres:17`.

## `publish-service.pipeline.yml`

Jobs:

- **`build-<service>`** — triggered by repository changes under `repo_path`. Gets Node LTS, the repository, and an RC version; sets the GitHub status to `pending`; runs `npm install`, `npm test -F=@budgetbuddyde/<service_name>`, `npm run build -F=...`, and `npm version`; then publishes the new RC version to the semver resource.
- **`release-patch` / `release-minor` / `release-major`** — get the next version, prepare the release commit and tag, update both version resources (`version` and `version-prod` in S3), and push the release commit back to the repository with `rebase`.

Credentials: `github.private_key`, `github.pat`, `s3-versions.*`, `discord.webhook_url`.

## `test-webapp.pipeline.yml`

Same structure as the service template: the build job runs `npm run check` and `npm run build` for the webapp, and the release jobs only bump the version, tag, and push the release commit. Used for validating and version-tracking `apps/webapp`.

Credentials: `github.private_key`, `github.pat`, `s3-versions.*`, `discord.webhook_url`.

> The template currently has the test step commented out and validates via `check` and `build` instead.

## `publish-npm-package.pipeline.yml`

Jobs:

- **`build-<package>`** — triggered by repository changes under `repo_path`. Runs tests and build for the package and a `npm publish --dry-run` to verify packaging, then publishes the RC version.
- **`release-patch` / `release-minor` / `release-major`** — bump the version, write an `.npmrc` containing `npm_token`, run `npm publish --access public`, commit and tag the release, and push the repository.

Credentials: `github.private_key`, `github.pat`, `s3-versions.*`, `npm_token`, `discord.webhook_url`.

## `manage-database.pipeline.yml`

Jobs:

- **`database-backup`** — runs daily (24-hour timer) in `postgres:17`, creates a compressed dump with `pg_dump -Fc`, and uploads it to the S3 backup bucket as `backup_<timestamp>.dump`.
- **`update-test-database`** — triggered by changes under `<repo_path>/drizzle/**`. Runs `npx drizzle-kit check` and `npm run db:migrate` against the test database.
- **`update-prod-database`** — runs the same migration task against the production database, gated on a successful test migration (`passed: [update-test-database]`).

Credentials: `github.private_key`, `s3-db-backup.*`, `manage-database.test-database-url`, `manage-database.prod-database-url`.

## Related pages

- [Architecture](/ci/architecture) — Vault and resources
- [Operating](/ci/operating) — create these pipelines with `fly`
