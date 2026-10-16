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
image publishing in this pipeline. The AI review runtime is published separately
by [AI Code Buddy](https://github.com/tklein1801/ai-code-buddy). This pipeline
consumes a fixed image digest and reuses completed analyses through S3. Existing tags and old
S3 data are not deleted. `database.pipeline.yml` remains independent and retains its
backup and migration tasks.

Both pipelines use the `ci-source` Git resource to load this repository's task
definitions from `main` via `file: ci-source/ci/tasks/<file>`. AI review lifecycle
tasks and their failure/error/abort hooks instead come from the pinned
`ai-code-buddy-source` Provider resource.
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
publishing credentials are required. The public AI Code Buddy image also needs
no registry-read credential. Supply `ai-code-buddy-source.private_key` as a
separate read-only Deploy Key for the private Provider task-source repository. The separate database pipeline retains its
own credentials.

AI review reuses these credential-manager variables:

- `ai-review.appId`, `ai-review.installationId`, `ai-review.appPrivateKey`:
  dedicated GitHub App with Contents read, Pull requests write and Checks write.
- `litellm.host`, `litellm.apiKey`: OpenAI-compatible `/v1` endpoint and a budgeted
  virtual key restricted to the operator-selected review model.
- `s3-ai-review.bucket`, `s3-ai-review.region`, `s3-ai-review.access_key_id`,
  `s3-ai-review.access_key_secret`: private result cache.

`ai-review-settings.model`, `ai-review-settings.contextWindow` and `ai-review-settings.profileRevision` are
nonsecret parameters in `ci/vars.yml`. Their separate namespace keeps static
settings from shadowing the `ai-review` credentials in the credential manager. The initial context limit is 32000 tokens;
verify it does not exceed the actual alias capacity. Increment the profile
revision whenever model routing or capabilities change. Fallbacks are disabled.

## PR-Agent tasks and rollout

The review job fetches the PR with `integration_tool: checkout`, pinned
`ai-code-buddy-source` task definitions and the matching `ai-code-buddy-image`.
The local adapter, image build and Python verification have moved to the Provider.
All review tasks and cleanup hooks use the same published runtime. The job does
not fetch the Consumer `repository` or `ci-source` inputs for executable review code.

Set `ai-code-buddy-settings.revision` to the actual published Provider commit and
`ai-code-buddy-settings.digest` to its matching registry digest. Both gets have no
trigger. `verify-ai-code-buddy-release.task.yml` compares the checked-out task
commit to embedded image metadata without credentials before preparation.
Mismatched releases fail before model calls. Updating the Provider alone does not
update this pipeline or review unchanged PR heads.

The reviewed repository's `.pr_agent.toml`, including `[ignore].glob` project
exclusions, is still loaded from the fixed target-branch commit through GitHub.
Only analysis receives the LiteLLM key; GitHub and S3 credentials stay in
preparation/publication, while cleanup receives App credentials.

The analysis task has a ten-minute limit and the three-task lifecycle has a
fifteen-minute limit. Both PR-Agent tools allow at most three chunks. Technical
errors, invalid results and incomplete required coverage fail the Concourse job
and block the GitHub gate. A fully published `changes_required` review completes
the Concourse job successfully with exit code 0 while setting `ai-review/gate` to
`failure`; `needs_review` passes with a visible warning. Merge enforcement belongs
to the required GitHub check.

Analysis saves private partial results atomically after each tool. Failure/error
hooks use `finalize` to publish individually validated findings and suggestions
with an “Analyse unvollständig” summary, tool status, coverage gaps and fixed
per-tool diagnostic codes. Missing recommendations are never inferred. Such
analyses still fail the job and check (or use `timed_out`) and are not cached in
S3. Finalization makes no model calls and uses the same comment markers and
fifteen-inline limit. Superseded or aborted runs post no new comments. Worker loss
can leave a pending check that does not permit merging; retry after recovery.
Build logs omit raw model responses, source code and secrets.

Publish and smoke-test the Provider before pinning its actual commit and digest
here. Verify public image access and the read-only task-source key, then load the
pipeline with the check optional. Perform the live scenarios in
[App setup](../docs/ai-review-github-app-setup.md), then require `ai-review/gate`
from the dedicated App in the main ruleset alongside normal CI. Require an
up-to-date branch. Provider updates and rollbacks change both pins together;
`db13f13c` is the Consumer return point before this first extraction. Existing
App registration and S3 reports remain. Merge queues and periodic base-only
reviews are not implemented.

See [Consumer architecture](../docs/ai-pr-review-concept.md) and
[Provider development](https://github.com/tklein1801/ai-code-buddy).

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
