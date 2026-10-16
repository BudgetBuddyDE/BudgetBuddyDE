# Project CI

`general.pipeline.yml` includes the following jobs:

- `validate-build`: validates and builds all npm workspaces on pushes to `main`.
  Every detected Git version is processed. Cogito reports pending, success,
  failure, error or abort to GitHub.
- `pull-request`: runs the same verification for pull requests targeting
  `repo.pr.branch`, and reports status through the GitHub PR resource.
- `pull-request-ai-review`: reviews every detected PR head targeting `main`,
  serially and independently of normal PR verification. Native PR-Agent review
  and suggestions use the configured LiteLLM alias. The App publishes the
  `ai-review/gate` check, a summary and up to fifteen inline comments/suggestions.
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
image publishing in this pipeline. Review containers are built locally and
completed AI analyses are persisted to S3 for retries. Existing tags and old
S3 data are not deleted. `database.pipeline.yml` remains independent and retains its
backup and migration tasks.

Both pipelines use the `ci-source` Git resource to load external task definitions
from `main` via `file: ci-source/ci/tasks/<file>`, including failure and abort hooks.
Jobs fetch this resource without a trigger; existing repository, PR and schedule
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

AI review reuses these credential-manager variables:

- `ai-review.appId`, `ai-review.installationId`, `ai-review.appPrivateKey`:
  dedicated GitHub App with Contents read, Pull requests write and Checks write.
- `litellm.host`, `litellm.apiKey`: OpenAI-compatible `/v1` endpoint and a budgeted
  virtual key restricted to the operator-selected review model.
- `s3-ai-review.bucket`, `s3-ai-review.region`, `s3-ai-review.access_key_id`,
  `s3-ai-review.access_key_secret`: private result cache.

`ai-review.model`, `ai-review.contextWindow` and `ai-review.profileRevision` are
nonsecret parameters in `ci/vars.yml`. The initial context limit is 32000 tokens;
verify it does not exceed the actual alias capacity. Increment the profile
revision whenever model routing or capabilities change. Fallbacks are disabled.

## PR-Agent tasks and rollout

The review job gets the PR with `integration_tool: checkout` and gets `main`
separately. Its task definitions come from `ci-source`; the Dockerfile and adapter
continue to come from the trusted `repository` input on main.
Only the OCI image build is privileged. The image is used directly for separate
prepare, analyze and publish tasks; only analyze receives the LiteLLM key, while
GitHub and S3 credentials remain in preparation/publication. PR verification and
its Python tests run without operational review secrets.

The analysis task has a ten-minute limit and the three-task lifecycle has a
fifteen-minute limit. Both PR-Agent tools allow at most three chunks. Technical
errors, invalid results, incomplete required coverage and `changes_required`
block. `needs_review` passes with a visible warning. Failure/error/abort hooks
finalize checks where possible; worker loss can leave a pending check that does
not permit merging. Retry the build after recovery.

First merge the adapter and trusted `.pr_agent.toml` into main and load the
pipeline with the check optional. Perform the live scenarios in
[App setup](../docs/ai-review-github-app-setup.md), then require `ai-review/gate`
from the dedicated App in the main ruleset alongside normal CI. Require an
up-to-date branch. This pipeline does not periodically re-review base-only
changes or support merge queues. Existing App registration and S3 reports remain.

See [architecture](../docs/ai-pr-review-concept.md) and
[Python development](../tools/ai-review/README.md).

## Local checks

### Validation commands

```sh
# Add a secret vars file for offline validation, or use placeholders.
fly validate-pipeline -c ci/general.pipeline.yml -l ci/vars.yml -l /path/to/secret-vars.yml --strict
fly validate-pipeline -c ci/database.pipeline.yml -l ci/vars.yml --strict
npm run ci
```

Pipeline validation does not run tasks or push changes. The dependency-update
task mutates dependencies and pushes only when executed through its pipeline.
