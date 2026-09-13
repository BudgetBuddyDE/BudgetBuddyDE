---
title: Operating
description: Set up the team, create pipelines, and trigger builds with fly.
icon: Terminal
---

All commands target the Concourse instance `ci.tklein.it` and the `budgetbuddyde` team.

## Prerequisites

- The `fly` CLI matching your Concourse version. See the [fly documentation](https://concourse-ci.org/fly.html).
- A login with access to the `budgetbuddyde` team.

## Login

```bash
fly -t ci login -c https://ci.tklein.it
```

For non-interactive logins, add `-u USER -p PASS`. The target alias `ci` is used in every command on this page.

If the team does not exist yet, ask a Concourse administrator to create it; pipelines are always managed with `--team budgetbuddyde`.

## Create pipelines

Run the commands from the `ci/` directory so the relative `-c ./pipelines/...` paths resolve. Setting a pipeline that already exists updates it.

> Pass secrets through Vault only — never as `-v` values, and never commit files under `secrets/**`.

### Webapp

```bash
fly -t ci set-pipeline -p webapp -c ./pipelines/test-webapp.pipeline.yml \
  --team budgetbuddyde \
  -v repo_owner="budgetbuddyde" \
  -v repo_name="budgetbuddyde" \
  -v repo_branch="main" \
  -v repo_path="apps/webapp" \
  -v service="app_webapp" \
  -v service_name="webapp"
```

### Database management

```bash
fly -t ci set-pipeline -p manage-database -c ./pipelines/manage-database.pipeline.yml \
  --team budgetbuddyde \
  -v repo_owner="budgetbuddyde" \
  -v repo_name="budgetbuddyde" \
  -v repo_path="packages/db" \
  -v service="pck_db" \
  -v service_name="db"
```

### Packages

Each package gets its own pipeline from the same template. The pipeline name must be unique per package; a shared name would overwrite the previous pipeline.

`db`:

```bash
fly -t ci set-pipeline -p db -c ./pipelines/publish-npm-package.pipeline.yml \
  --team budgetbuddyde \
  -v repo_owner="budgetbuddyde" \
  -v repo_name="budgetbuddyde" \
  -v repo_path="packages/db" \
  -v service="pck_db" \
  -v service_name="db"
```

`api`, `core`, and `logger` follow the same pattern with `repo_path="packages/<name>"`, `service="pck_<name>"`, `service_name="<name>"`, and `-p <name>`.

### Services

`auth-service`:

```bash
fly -t ci set-pipeline -p auth-service -c ./pipelines/publish-service.pipeline.yml \
  --team budgetbuddyde \
  -v repo_owner="budgetbuddyde" \
  -v repo_name="budgetbuddyde" \
  -v repo_path="services/auth-service" \
  -v docker_image="ghcr.io/budgetbuddyde/auth-service" \
  -v service="bb_auth_service" \
  -v service_name="auth-service"
```

`backend` (`repo_path="services/backend"`, `docker_image="ghcr.io/budgetbuddyde/backend"`, `service="bb_backend"`) and `mcp` (`repo_path="services/mcp"`, `docker_image="ghcr.io/budgetbuddyde/mcp"`, `service="bb_mcp"`) follow the same pattern.

## Manage pipelines

New pipelines start paused. Unpause them to let their triggers fire:

```bash
fly -t ci unpause-pipeline -p <pipeline> --team budgetbuddyde
```

Other useful commands:

| Command                                                          | Purpose                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------ |
| `fly -t ci trigger-job -j <pipeline>/<job> --team budgetbuddyde` | Manually trigger a job                                 |
| `fly -t ci get-pipeline -p <pipeline> --team budgetbuddyde`      | Show the resolved pipeline (secrets stay as `((...))`) |
| `fly -t ci destroy-pipeline -p <pipeline> --team budgetbuddyde`  | Delete a pipeline                                      |

To update a pipeline, re-run its `set-pipeline` command; triggers and job history are preserved.

## Deploy keys

The repository resource fetches the Git repository with a deploy key. Generate one with:

```bash
ssh-keygen -t rsa -b 4096 -C "ci@tklein.it"
```

Register the public key on the GitHub repository (read access is enough) and store the private key in Vault as the `private_key` field of the `github` secret. See [Architecture](/ci/architecture) for the lookup paths.

## Related pages

- [Architecture](/ci/architecture)
- [Pipelines](/ci/pipelines)
