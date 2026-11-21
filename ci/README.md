# Concourse CI

`pipeline.yaml` runs the same workspace verification for branch builds and pull
requests: Node and pnpm versions are checked against the repository pins, then
`vp install --frozen-lockfile` and `pnpm run ci` run in the pinned Vite+ image.
Turborepo builds workspace dependencies in order. Workers need network access
to download the pinned tools and dependencies.

## Pull request AI review

`pr-ai-review` runs after `pr-checks` passes the same PR resource version.
It uses Open Code Review v1.14.0 to analyze the PR diff, then publishes a
GitHub review with inline comments and applicable suggestions. The PR branch
is never modified by the reviewer. Dependabot auto-merge runs only after both
jobs pass.

Configure `review.url` and `review.token` for a provider approved to receive
repository code. `ci/vars.yaml` sets `review.model`, the protocol, request
timeout (seconds), and token budget. Use a model ID supported by the configured
endpoint. The publisher uses the existing `github.pat`, which needs
**Pull requests: write** on this repository in addition to its existing commit
status permissions. The OCR task receives only the model token. Raw review
output is not printed to CI logs.

After a controlled rollout, require `concourse-ci/ai-review` in the GitHub
ruleset for `main` alongside the existing PR check. A complete review without a
critical finding reports `success`; a critical finding reports `failure`.
Incomplete or skipped reviews, including lockfile-only PRs if OCR skips them,
and technical failures report `error`. Both `failure` and `error` block merges
once the check is required. If a run becomes stale, update the PR branch to
trigger a fresh review; re-running an old build may reuse its resource checkout.
Enable GitHub's up-to-date branch requirement if a change to `main` must also
invalidate an already successful review of an unchanged PR commit.

## Other jobs

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

Local verification:

```sh
fly validate-pipeline -c ci/pipeline.yaml -l ci/vars.yaml --strict
pnpm run ci
```

Pipeline validation does not execute jobs. Do not run migration, backup, update,
or auto-merge jobs merely to validate the pipeline: they have remote side effects.
