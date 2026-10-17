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
fly -t ci set-pipeline --team budgetbuddyde -p general -c ci/general.pipeline.yml -l ci/vars.yml
fly -t ci unpause-pipeline --team budgetbuddyde -p general
```

`ci/vars.yml` provides `repo.owner`, `repo.name`, `repo.pr.branch`, `git.name`, `git.email`, model profile settings and the paired AI Code Buddy release pins. Review those values before applying. The pipeline checks pushes to `main`; `repo.pr.branch` controls the PR target branch, not the main Git resource.

Provision `github.private_key` with repository write access and `github.pat` with repository/PR visibility and status-write permissions. Branch protection must allow the dependency-update identity to push.

The project pipeline includes backend, authentication, MCP, webapp, documentation, shared packages, and examples through the root workspace commands. Do not create separate per-workspace release pipelines for this workflow. It does not version or publish anything.

## AI review releases

The runtime is published by the separate `ai-code-review` Provider pipeline in
team `main`. This project consumes its public GHCR image and private task source.
No local Python installation or runtime image build is required.

1. Obtain a successfully published Provider commit and its matching manifest digest, and verify the public image can be pulled anonymously.
2. Update `ai-code-buddy-settings.revision` and `.digest` together in `ci/vars.yml`. Verify Provider task-source read access using the existing `github.private_key`. Existing App, LiteLLM and S3 secrets remain unchanged.
3. Run `npm run test:ci-contracts` and strict pipeline validation, then load the project pipeline. Release verification must succeed before preparation; test a mismatched pair to confirm early rejection.
4. Run live acceptance with a clean PR, a blocker, a new commit, a technical LiteLLM failure and a repeated completed identity. A fully published blocking review means a green Concourse job and red `ai-review/gate`.
5. Require the dedicated App check only after confirming actual merge blocking; retain existing CI and up-to-date-branch requirements.

The complete acceptance checklist is maintained in the repository's
`docs/ai-review-github-app-setup.md`. A new Provider release does not trigger
Consumer reviews by itself. Later rollback restores both pins to an accepted
pair. The initial migration's return point is Consumer commit `db13f13c` with its
local runtime; retain credentials and S3 data during rollback.

## Database pipeline

The database pipeline uses the shared repository settings in `ci/vars.yml`:

```bash
fly validate-pipeline -c ci/database.pipeline.yml -l ci/vars.yml --strict
fly -t ci set-pipeline --team budgetbuddyde -p manage-database -c ci/database.pipeline.yml -l ci/vars.yml
fly -t ci unpause-pipeline --team budgetbuddyde -p manage-database
```

Before enabling it, provision the [database credentials](/ci/architecture#secret-inventory), including the production URL used for backups and migrations. Migration source is filtered to `packages/db/**`, and the task builds database dependencies through Turborepo before applying migrations.

Production migration is manual and gated on a successful test migration:

```bash
fly -t ci trigger-job --team budgetbuddyde -j manage-database/update-prod-database --watch
```

Inspect the selected repository version and test result before applying production migrations. Backups run daily; changes to migration files automatically trigger the test job.

## Manual runs and maintenance

```bash
fly -t ci trigger-job --team budgetbuddyde -j general/validate-build --watch
fly -t ci trigger-job --team budgetbuddyde -j general/update-dependencies --watch
fly -t ci trigger-job --team budgetbuddyde -j manage-database/database-backup --watch
```

Dependency updates run automatically every 168 hours and are serialized. Unresolved audit findings or failures in `npm run ci` prevent the push. Concurrent external main changes can reject a push; the workflow does not force-push or rebase validated changes.

Useful management commands:

| Command                                                         | Purpose                                                           |
| --------------------------------------------------------------- | ----------------------------------------------------------------- |
| `fly -t ci get-pipeline --team budgetbuddyde -p general`        | Inspect the configured pipeline                                   |
| `fly -t ci pause-pipeline --team budgetbuddyde -p <pipeline>`   | Stop automatic scheduling for a pipeline                          |
| `fly -t ci unpause-pipeline --team budgetbuddyde -p <pipeline>` | Enable scheduling                                                 |
| `fly -t ci destroy-pipeline --team budgetbuddyde -p <pipeline>` | Remove a live pipeline after explicitly confirming it is obsolete |

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
