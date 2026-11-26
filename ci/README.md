# Concourse CI

`pipeline.yaml` runs the same workspace verification for branch builds and pull
requests: Node and pnpm versions are checked against the repository pins, then
`vp install --frozen-lockfile` and `pnpm run ci` run in the pinned Vite+ image.
Turborepo builds workspace dependencies in order. Workers need network access
to download the pinned tools and dependencies.

## Other jobs

Dependency updates run weekly, validate before committing, and push using the
`repository` resource. The Git identity needs permission to push
to the configured branch. Dependabot auto-merge runs only after `pr-checks`
passes for the same PR resource version. It requires a GitHub token with
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
