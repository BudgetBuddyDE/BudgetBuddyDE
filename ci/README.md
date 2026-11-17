# Concourse CI

`pipeline.yaml` runs the same workspace verification for branch builds and pull
requests: Node and pnpm versions are checked against the repository pins, then
`vp install --frozen-lockfile` and `pnpm run ci` run in the pinned Vite+ image.
Turborepo builds workspace dependencies in order. Workers need network access
to download the pinned tools and dependencies.

Dependency updates run weekly, validate before committing, and push using the
`repository` resource. The Git identity needs permission to push
to the configured branch. Dependabot auto-merge requires a GitHub token with
appropriate pull-request permissions and repository auto-merge enabled.

Database changes trigger test migrations; production migrations are manual and
restricted to revisions that passed the test job. Backups run on the configured
interval. Migration tasks use the database revision, while task definitions are
loaded from the configured repository branch, not from pull requests.

Load `ci/vars.yaml` when configuring the pipeline. Supply `github.private_key`,
`github.pat`, `database.test-database-url`, `database.prod-database-url`, and
the `s3-db-backup` credentials and bucket settings through the credential
manager. Never commit secrets. No package or container publishing is configured.

## AI pull request reviews

The independent `ai-code-review` job uses the existing PR resource and does not
block `pr-checks` or Dependabot auto-merge. It reviews open, non-draft PRs whose
head repository is this repository. Fork PRs are skipped. The job checks the
current head SHA before invoking PR-Agent, but a push can still race with the
review. A draft marked ready without a new commit may not trigger a new resource
version. Rerun its build or push a commit to request a review.

Before enabling the job, verify the PR-Agent release and digest in `ci/vars.yaml`.
Supply the LiteLLM OpenAI-compatible API URL as `ai-review.api-base` when setting the pipeline.
Supply `github.ai-review-pat` and `ai-review.api-key` through the credential
manager. All these values are required when applying the full pipeline, even
if the review job stays paused. The GitHub token needs repository read and pull
request comment write permissions. LiteLLM manages model routing, budgets and limits. The model is
configured in `.pr_agent.toml`, which PR-Agent reads from the default branch.
Validate the model's context limit and the image's CLI and settings before use.

The preparation task and its script come from the protected repository branch,
not the PR. The PR checkout is used only for metadata. Preparation gets a GitHub
token but no LiteLLM key. It outputs an empty URL list when the PR is excluded;
Concourse then skips the review task. Otherwise the review task invokes
`python -m pr_agent.cli --pr_url <url> review` directly. Verify the empty-list
behavior and CLI invocation on the deployed Concourse version and pinned image.
Do not run PR code or load configuration from a PR branch. Restrict network access to GitHub and the
approved LiteLLM endpoint. Treat PR text as untrusted model input and obtain
approval before sending code to the endpoint. Polling runs every minute; no
webhook is required. Job failures indicate technical errors, not review verdicts.
Pause `ai-code-review` to disable reviews without stopping the remaining jobs.

Local verification:

```sh
fly validate-pipeline -c ci/pipeline.yaml -l ci/vars.yaml --strict
pnpm run test:ci-contracts
pnpm run ci
```

Pipeline validation does not execute jobs. Do not run migration, backup, update,
or auto-merge jobs merely to validate the pipeline: they have remote side effects.
