---
title: Operating
description: Configure the current pipelines and trigger jobs with fly.
icon: Terminal
---

Run commands from the repository root. Use a `fly` CLI matching the Concourse deployment and an account with access to the `budgetbuddyde` team.

## Login

```bash
fly -t ci login -c https://ci.tklein.it -n budgetbuddyde
```

The alias `ci` is used throughout this page. If the team does not exist, ask an administrator to create it. Supply secrets through Vault, not committed files or `-v` arguments.

## Project pipeline

Validate locally before setting the pipeline:

```bash
fly validate-pipeline -c ci/general.pipeline.yml -l ci/vars.yml --strict
fly -t ci set-pipeline -p app -c ci/general.pipeline.yml -l ci/vars.yml
fly -t ci unpause-pipeline -p app
```

`ci/vars.yml` provides `repo.owner`, `repo.name`, `repo.pr.branch`, `git.name`, and `git.email`. Review those values before applying. The pipeline checks pushes to `main`; `repo.pr.branch` controls the PR target branch, not the main Git resource.

Provision `github.private_key` with repository write access and `github.pat` with repository/PR visibility and status-write permissions. Branch protection must allow the dependency-update identity to push.

The project pipeline includes backend, authentication, MCP, webapp, documentation, shared packages, and examples through the root workspace commands. Do not create separate per-workspace release pipelines for this workflow. It does not version or publish anything.

## Database pipeline

The database pipeline retains its flat repository variables:

```bash
fly validate-pipeline -c ci/database.pipeline.yml --strict \
  -v repo_owner=budgetbuddyde -v repo_name=budgetbuddyde -v repo_path=packages/db
fly -t ci set-pipeline -p manage-database -c ci/database.pipeline.yml \
  -v repo_owner=budgetbuddyde -v repo_name=budgetbuddyde -v repo_path=packages/db
fly -t ci unpause-pipeline -p manage-database
```

Before enabling it, provision the [database credentials](/ci/architecture#secret-inventory), including separate production URL references for backups and migrations. The migration task currently fixes its working directory to `packages/db`, so keep that `repo_path` value.

Production migration is manual and gated on a successful test migration:

```bash
fly -t ci trigger-job -j manage-database/update-prod-database --watch
```

Inspect the selected repository version and test result before applying production migrations. Backups run daily; changes to migration files automatically trigger the test job.

## Manual runs and maintenance

```bash
fly -t ci trigger-job -j app/validate-build --watch
fly -t ci trigger-job -j app/update-dependencies --watch
fly -t ci trigger-job -j manage-database/database-backup --watch
```

Dependency updates run automatically every 168 hours and are serialized. Unresolved audit findings or failures in `npm run ci` prevent the push. Concurrent external main changes can reject a push; the workflow does not force-push or rebase validated changes.

Useful management commands:

| Command                                    | Purpose                                                           |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `fly -t ci get-pipeline -p app`            | Inspect the configured pipeline                                   |
| `fly -t ci pause-pipeline -p <pipeline>`   | Stop automatic scheduling for a pipeline                          |
| `fly -t ci unpause-pipeline -p <pipeline>` | Enable scheduling                                                 |
| `fly -t ci destroy-pipeline -p <pipeline>` | Remove a live pipeline after explicitly confirming it is obsolete |

Setting an existing pipeline updates its configuration. Renamed/removed jobs are not equivalent to retaining their previous build history under new names. Pause obsolete workspace/release pipelines and check their responsibilities before removing them. Deleting YAML files does not remove live pipelines, published artifacts, Git tags, or S3 objects.

## Deploy keys

Generate a key if needed:

```bash
ssh-keygen -t ed25519 -C "ci@tklein.it"
```

Register the public key with write access for dependency updates and store the private key in Vault as `github.private_key`. A read-only key is sufficient only for workflows that never push.

## Related pages

- [Architecture](/ci/architecture)
- [Pipelines](/ci/pipelines)
