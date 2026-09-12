---
title: CI/CD
description: Validate pull requests and release workspace units with the Concourse pipeline.
icon: Workflow
---

The Concourse pipeline in `ci/` validates pull requests and releases every workspace unit. Maintainers with
access to the Concourse instance update it with the [fly CLI](https://concourse-ci.org/fly.html).

> [!IMPORTANT]
> Never commit secrets. Everything under `ci/secrets/` is ignored by git.

## Pipeline overview

`ci/pipelines/budgetbuddyde.pipeline.yml` is the single pipeline for the whole monorepo. It replaces the previous
per-unit pipelines and the former GitHub Actions CI workflow.

- **Pull requests against `main`** trigger `pull-request-check` for every commit. It runs `npm ci` and
  `npm run ci` (format, lint, typecheck, test, build) and reports the result to GitHub with the
  `concourse/validate` commit status.
- **Pushes to `main`** release every unit whose paths changed. The patch job runs automatically, creates an
  annotated git tag `<unit>-v<version>` and stores the new version in the S3 semver store.
- **Minor and major releases** are triggered manually with the `release-<unit>-minor` and
  `release-<unit>-major` jobs.
- **Database migrations** are applied to the test database and, after success, to the production database.
  A daily job dumps the production database to S3.

Release jobs never commit to `main`. They only create tags, so a release cannot retrigger the pipeline. The S3
semver store is the source of truth for versions; `package.json` versions in the repository are not updated.
See [Releases](/contributing/releases) for the manual review checklist.

### Units

| Unit           | Path                    | Release                                   | Version key               |
| -------------- | ----------------------- | ----------------------------------------- | ------------------------- |
| `webapp`       | `apps/webapp`           | Git tag (deployed by Railway from source) | `app_webapp/version`      |
| `mcp`          | `services/mcp`          | Git tag (deployed by Railway from source) | `bb_mcp/version`          |
| `backend`      | `services/backend`      | Git tag (deployed by Railway from source) | `bb_backend/version`      |
| `auth-service` | `services/auth-service` | Git tag (deployed by Railway from source) | `bb_auth_service/version` |
| `api`          | `packages/api`          | npm publish `@budgetbuddyde/api`          | `pck_api/version`         |
| `db`           | `packages/db`           | npm publish `@budgetbuddyde/db`           | `pck_db/version`          |
| `core`         | `packages/core`         | npm publish `@budgetbuddyde/core`         | `pck_core/version`        |
| `logger`       | `packages/logger`       | npm publish `@budgetbuddyde/logger`       | `pck_logger/version`      |

The shared release logic lives in `ci/tasks/release-unit.yml` and `ci/tasks/release-unit.sh`. For npm packages
it removes `private` and internal `@budgetbuddyde/*` dependencies before publishing. If a package starts
importing another workspace package, the release fails and the dependency has to be published first.

## Using the fly CLI

### Login

```bash
fly -t TARGET login -c HOST -u USER -p PASS
```

### Variables

Create a local `ci/secrets/vars.yml`. It is gitignored and passed to `fly` at pipeline setup time:

```yaml
repo_owner: budgetbuddyde
repo_name: BudgetBuddyDE
github:
  private_key: |
    -----BEGIN OPENSSH PRIVATE KEY-----
    ...
  pat: ghp_replace_me
npm_token: npm_replace_me
discord:
  webhook_url: https://discord.com/api/webhooks/...
s3-versions:
  bucket: replace_me
  region: eu-central-1
  access_key_id: replace_me
  access_key_secret: replace_me
s3-db-backup:
  bucket: replace_me
  region: eu-central-1
  access_key_id: replace_me
  access_key_secret: replace_me
manage-database:
  test-database-url: postgres://user:password@host:5432/database
  prod-database-url: postgres://user:password@host:5432/database
```

`github.private_key` is an SSH deploy key with write access, `github.pat` needs the `repo:status` scope and
`npm_token` must allow publishing the `@budgetbuddyde` scope.

### Set pipeline

> [!IMPORTANT]
> Run these commands from the repository root.

```bash
fly -t ci set-pipeline \
  --pipeline budgetbuddyde \
  --config ./ci/pipelines/budgetbuddyde.pipeline.yml \
  --team budgetbuddyde \
  --load-vars-from ./ci/secrets/vars.yml
```

### Unpause pipeline

```bash
fly -t ci unpause-pipeline -p budgetbuddyde
```

### Manually trigger a job

```bash
fly -t ci trigger-job -j budgetbuddyde/release-backend-minor
fly -t ci trigger-job -j budgetbuddyde/release-api-major
fly -t ci trigger-job -j budgetbuddyde/update-test-database
```

### Watch a job

```bash
fly -t ci watch -j budgetbuddyde/release-core-patch
```

### Generate an SSH key

```bash
ssh-keygen -t ed25519 -C "concourse@budget-buddy.de"
```

## GitHub status checks

The pipeline reports these commit statuses:

- `concourse/validate` for pull requests
- `concourse/release-<unit>-patch`, `concourse/release-<unit>-minor`, `concourse/release-<unit>-major`
  for releases on `main`

Update the branch protection rule for `main` so `concourse/validate` is a required status check instead of the
old GitHub Actions checks.

## Dependency updates

`.github/workflows/update-dependencies.yml` is kept. It opens a pull request with updated npm dependencies
which is then validated by `pull-request-check`.

## Adding a new unit

1. Add a `repo-<unit>` git resource with the unit path, its workspace dependencies and the root files
   (`package.json`, `package-lock.json`, `turbo.json`, `tsconfig.json`).
2. Add a `version-<unit>` semver resource with a new S3 key under `s3-versions`.
3. Copy the `release-<unit>-patch`, `-minor` and `-major` jobs and set `UNIT_NAME`, `UNIT_PATH`,
   `NPM_PACKAGE` and `UNIT_TYPE` (`npm` or `app`).
4. Add the unit to the `packages`, `apps` or `services` group.
5. Validate the pipeline locally before updating the Concourse instance:

   ```bash
   fly validate-pipeline -c ./ci/pipelines/budgetbuddyde.pipeline.yml
   ```
