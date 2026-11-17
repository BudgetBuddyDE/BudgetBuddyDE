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
current head SHA before each CLI command. PR-Agent fetches the PR by URL, so a
push can still race with either command. Marking a draft ready without a new
commit may not trigger a new resource version. Rerun its build or push a commit
to request a review.

`ci/vars.yaml` pins the PR-Agent image under `ai-review-image`, separate from
connection settings. Provide these runtime values through the credential manager:

- `github.ai-review-read-pat`: repository-scoped token with pull request read access for preparation.
- `github.ai-review-pat`: repository-scoped token with contents read and pull request write access for PR-Agent.
- `ai-review.api-base`: approved LiteLLM OpenAI-compatible API base URL, without `/chat/completions`.
- `ai-review.api-key`: LiteLLM key limited to the `code-review` route.

PR-Agent reads the model and `custom_model_max_tokens` from `.pr_agent.toml` on
the default branch. It uses the input limit to size the diff. The initial limit
is 64,000 tokens. Before rollout, verify it against the lowest supported input
limit across the models behind `code-review`. LiteLLM still manages routing and budgets.

The preparation task and its script come from the protected repository branch,
not the PR. The PR checkout is used only for metadata. Preparation gets a GitHub
token but no LiteLLM key. It outputs an empty URL list when the PR is excluded;
Concourse then skips both CLI commands. For an eligible PR, the job runs
`python -m pr_agent.cli --pr_url <url> review` for the summary and inline findings.
After a successful review, the job checks eligibility again against the same
resource version. It runs `python -m pr_agent.cli --pr_url <url> improve` only if
the PR still qualifies. PR-Agent publishes applicable fixes as GitHub suggestions.
Someone must accept a suggestion in GitHub to apply it. `improve` can make
multiple additional LiteLLM calls depending on the diff. If it fails, the AI job
fails, but an already published review stays visible.
A resource checkout can fail before preparation, for example when a fork uses
the same branch name as the base.
Do not run PR code or load configuration from a PR branch. Restrict network access to GitHub and the
approved LiteLLM endpoint. Treat PR text as untrusted model input and obtain
approval before sending code to the endpoint. Polling runs every minute; no
webhook is required. Job failures indicate technical errors, not review verdicts.
Pause `ai-code-review` to disable reviews without stopping the remaining jobs.

Before unpausing the job, run a staging smoke test on a Concourse worker:

1. Open a same-repository, non-draft PR with a known, fixable issue. Confirm `review`, then `improve`, and the `code-review` route in LiteLLM. Verify that GitHub shows **Commit suggestion** without applying it.
2. Test a draft, a fork, and an older SHA. Confirm neither command runs and LiteLLM receives no request.
3. Push a new commit between `review` and the second eligibility check. Confirm the older build skips `improve`.
4. Simulate an `improve` failure in staging. Confirm the AI job fails, the review stays visible, and `pr-checks` stays independent.
5. Rerun the same SHA and check for duplicate inline suggestions.

Local verification:

```sh
fly validate-pipeline -c ci/pipeline.yaml -l ci/vars.yaml --strict
pnpm run test:ci-contracts
pnpm run ci
```

Pipeline validation does not execute jobs. Do not run migration, backup, update,
or auto-merge jobs merely to validate the pipeline: they have remote side effects.
`pnpm run test:ci-contracts` needs Python 3 locally. Concourse runs these tests
in a separate pinned Python task, so the workspace build image does not need Python.
