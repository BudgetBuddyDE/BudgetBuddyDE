# Project CI

`general.pipeline.yml` includes the following jobs:

- `validate-build`: validates and builds all npm workspaces on pushes to `main`.
  Every detected Git version is processed. Cogito reports pending, success,
  failure, error or abort to GitHub.
- `pull-request`: runs the same verification for pull requests targeting
  `repo.pr.branch`, and reports status through the GitHub PR resource.
- `pull-request-ai-review`: every five minutes, serially reconciles open PRs
  using a Go runner image built from the trusted `main` checkout. Reviews are cached by immutable
  identity in S3; target-branch changes cause a new review. Negative or incomplete
  reviews fail the dedicated `ai-review/gate` GitHub Check.
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

## Local checks

### AI review deployment

The Vault-backed variables are `ai-review.appId`, `ai-review.installationId`,
`ai-review.appPrivateKey`, `litellm.host`, `litellm.apiKey`,
`s3-ai-review.bucket`, `s3-ai-review.region`, `s3-ai-review.access_key_id`,
and `s3-ai-review.access_key_secret`. `litellm.host` includes `/v1`
(configured endpoint: `https://ai.tklein.online/v1`). The model alias is `code-review`.

The job builds `tools/ai-review/Dockerfile` from the trusted `repository` resource
(`main`) using `concourse/oci-build-task`, then passes its unpacked image directly
to the review task. No custom registry or committed image archive is required.
The builder requires a worker that permits privileged tasks and network access to
the public build/base images and Go modules. The review task itself is not
privileged and receives secrets only after the image build. Build layers are cached
on the worker. Builder and Dockerfile base images currently use mutable tags;
pinning their digests remains deployment hardening work.

The provided task maps AWS environment credentials. Prefer short-lived credentials
injected by your credential integration; include `AWS_SESSION_TOKEN` in the task
when using temporary credentials. Alternatively adapt it to your worker's workload
identity and remove the explicit access-key parameters. Do not expose review
credentials to PR verification tasks. Keep the review job serial.

Merge runner changes only after maintainer review. See
`tools/ai-review/README.md` and `docs/ai-review-github-app-setup.md` for environment,
limits, bucket setup, App permissions and required ruleset activation. Bootstrap
the policy on the target branch before enabling the required check. Pipeline
deployment now requires the additional variables; no existing job is silently
treated as the AI gate.

Activation TODO: after a successful live test, configure the `main` ruleset to
require `ai-review/gate` from this GitHub App. Until then, failed reviews do not
enforce merge blocking. Also retain the existing required CI checks and enable
the up-to-date branch requirement.

### Validation commands

```sh
fly validate-pipeline -c ci/general.pipeline.yml -l ci/vars.yml --strict
fly validate-pipeline -c ci/database.pipeline.yml -l ci/vars.yml --strict
npm run ci
```

Pipeline validation does not run tasks or push changes. The dependency-update
task mutates dependencies and pushes only when executed through its pipeline.
