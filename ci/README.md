# Project CI

`general.pipeline.yml` includes the following jobs:

- `validate-build`: validates and builds all pnpm workspaces on pushes to `main`.
  Every detected Git version is processed. Cogito reports pending, success,
  failure, error or abort to GitHub.
- `pull-request`: runs the same verification for pull requests targeting
  `repo.pr.branch`, and reports status through the GitHub PR resource.
- `update-dependencies`: runs every 168 hours or manually. Updates dependency
  ranges to latest versions with `vp update --latest`,
  applies audit fixes, then validates before pushing changed manifests and lockfile.
  Only one update build runs at a time. Concurrent external pushes fail safely
  rather than forcing or rebasing the update.

Verification uses Node 24.21.0, the pinned pnpm version, `vp install --frozen-lockfile` and `pnpm run ci`: formatting, lint,
type checking, tests and builds, with dependencies orchestrated by Turborepo.
The GitHub PR resource uses the maintained cloudfoundry-community fork, published
as `cfcommunity/github-pr-resource`, pinned to image tag `0.26.0`.
The dependency-update task uses the same Vite+ image as verification and migrations.
Git is available in the Vite+ image.
Unresolved audit findings or failed validation prevent the dependency push.
Dependency commits do not contain `[skip ci]`, so main validation runs afterward.

There is no package versioning, Git tag creation, npm publishing or Docker
image publishing in this pipeline. `database.pipeline.yml` remains independent
and retains its backup and migration tasks.

Automated pull request reviews run in the separate GitHub Actions workflow at
`.github/workflows/pr-agent.yml`; they are not part of the Concourse pipelines.
See [PR-Agent setup](../.github/pr-agent.md) for its GitHub App, LiteLLM, and
security configuration.

Both pipelines use the `ci-source` Git resource to load this repository's task
definitions from `main` via `file: ci-source/ci/tasks/<file>`.
Jobs fetch `ci-source` without a trigger; existing repository, PR and schedule
resources continue to control when they run. PR verification still checks the PR
input, and builds and migrations keep their existing repository inputs and input
mappings. Task changes in a PR take effect after merging into `main`.

## CI toolchain images

Each shared task file owns its runtime image through its `image_resource`:
`verify.task.yml`, `update-dependencies.task.yml` and
`apply-db-migration.task.yml`. They currently use
`ghcr.io/voidzero-dev/vite-plus:1.3.0`, pinned to an immutable digest. The parent
pipelines do not fetch or override the task image, so each task can select and
upgrade its image independently. Keep an explicit digest pin for reproducibility.

The image supplies Vite+ and managed Node tooling. The repository uses pnpm for workspace installation and Vite+ for project scripts, with Turborepo providing task orchestration. After changing into the repository input,
each task prints `vp`, Node and pnpm versions and checks them against the
repository pins before installing dependencies:

- `.node-version` selects Node.js 24.21.0.
- `package.json`'s `packageManager` field selects the pinned pnpm version.

The shims download the selected Node.js and pnpm versions on first use. Workers
therefore need outbound access for those downloads as well as package dependencies;
the image digest does not make the tasks offline-ready. No new Concourse caches
are introduced. The image's `PATH` and `VP_HOME` remain unchanged so its shims and
managed toolchain stay available; no task `params` overrides are needed for them.

All three shared task files explicitly set `run.user: root` to preserve the
permissions of the previous Node images. Older Concourse workers can leave
repository inputs owned by root, so the tasks need write access for dependency
installation, builds and dependency updates. This does not enable privileged
containers and requires no manual `chown`.

The database backup task keeps `postgres:17`. Backend and documentation Docker
build stages use the pinned Vite+ toolchain image, with separate production
dependency and runtime stages. Both Docker builds use pnpm and the root lockfile;
the static documentation image serves the generated site with nginx.

### Updating the toolchain

Update the repository, tag and digest in the relevant task file when changing
its image, and verify the digest against the selected release. An image upgrade
is separate from a Node/pnpm upgrade: update `.node-version` and `package.json`'s
`packageManager` when changing those runtime versions. The version checks fail
before dependency installation if the shims do not resolve the repository's
requested versions.

Both pipelines load task definitions from `main`, not from the PR. A task image
change therefore takes effect in Concourse after the change is merged to `main`.

Upstream references: [Vite+ Docker images](https://viteplus.dev/guide/docker),
[Vite+ environment management](https://viteplus.dev/guide/env), and
[published image versions and digests](https://github.com/voidzero-dev/vite-plus/pkgs/container/vite-plus).

## Database migrations

The database migration task installs dependencies with `vp install --frozen-lockfile` at the repository
root, then runs `pnpm exec turbo run build --filter=@budgetbuddyde/db`. Turborepo builds the
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

`git.name` and `git.email` identify automated dependency commits. No npm-registry publishing or GHCR
publishing credentials are required. The separate database pipeline retains its
own credentials.

## Local checks

### Validation commands

```sh
fly validate-pipeline -c ci/general.pipeline.yml -l ci/vars.yml --strict
fly validate-pipeline -c ci/database.pipeline.yml -l ci/vars.yml --strict
vp run test:ci-contracts
pnpm run ci
```

Pipeline validation does not run tasks or push changes. The dependency-update
task mutates dependencies and pushes only when executed through its pipeline.

### Standalone verification task

To run the verification task on a Concourse worker using its task-local image:

```sh
fly -t <target> execute -c ci/tasks/verify.task.yml -i repository=.
```

Unlike pipeline validation, this command uploads the local repository input and
executes the task remotely. Review the upload contents first and exclude secrets,
including ignored `.env` files and other `.gitignored` credentials. Do not assume
Git ignore rules alone protect a local input upload. The task needs no production
secrets. No pipeline image override or CI variables file is needed to resolve the
task's image.
