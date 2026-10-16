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

There is no versioning, Git tag creation, S3 version persistence, npm publishing
or Docker image publishing in this pipeline. Existing tags and S3 version data
are not deleted. `database.pipeline.yml` remains independent and retains its
backup and migration tasks.

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

- `github.private_key`: repository read/write access for dependency updates.
  Branch protection must permit this identity to push to main.
- `github.pat`: commit and pull request status access.

`git.name` and `git.email` identify automated dependency commits. No npm, GHCR
or S3 version credentials are required by the project pipeline. The separate
database pipeline still requires its own credentials.

## AI review temporarily disabled

AI Code Buddy is not part of the active pipeline while its integration concept
is being revised. The review job, timer, image build, dedicated Go verification
steps and review credential references have been removed. Normal main/PR
verification and dependency updates remain active. Existing tool files, policy
and documentation are retained for later use.

Load the updated pipeline into Concourse and stop any already-running review
builds if necessary. If GitHub currently requires `ai-review/gate`, temporarily
remove that requirement from the branch ruleset so missing reviews do not block
merges. Retain normal CI checks. Vault secrets and the GitHub App can remain.

## Local checks

### Validation commands

```sh
fly validate-pipeline -c ci/general.pipeline.yml -l ci/vars.yml --strict
fly validate-pipeline -c ci/database.pipeline.yml -l ci/vars.yml --strict
npm run ci
```

Pipeline validation does not run tasks or push changes. The dependency-update
task mutates dependencies and pushes only when executed through its pipeline.
