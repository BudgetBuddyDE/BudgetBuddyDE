# CI

This directory contains the Concourse workflows for this project.

> [!IMPORTANT]
> Make sure not to commit any secrets under `secrets/**`

## Using the fly-CLI

More information about what the fly-CLI is and how to use it can be found [here](https://concourse-ci.org/fly.html).

### Login

```bash
fly -t TARGET login -c HOST -u USER -p PASS
```

### Add pipeline

```bash
fly -t TARGET set-pipeline -p PIPELINE -c PATH_TO_FILE

# with variables
fly -t TARGET set-pipeline -p PIPELINE -c PATH_TO_FILE -v repo_uri="git@github.com:kleithor/ci.git"

# with variables and file-contents
fly -t TARGET set-pipeline -p PIPELINE -c PATH_TO_FILE -v repo_private_key="$(cat ./secrets/github/id_rsa)"
```

### Unpause pipeline

```bash
fly -t TARGET unpause-pipeline -p PIPELINE
```

### Manually trigger a job

```bash
fly -t TARGET trigger-job -j PIPELINE/JOB
```

### Generate ssh-key

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

## Help

- Retrieve an specific line from an file

  ```bash
  cat secrets/aws/temp | sed -n '1p'
  ```

## Set up pipelines

> [!IMPORTANT]
> Make sure to run these commands from the current directory (`./ci/...).

### Test `@budgetbuddyde/webapp`

```bash
fly -t ci set-pipeline -p webapp -c ./pipelines/test-webapp.pipeline.yml \
  --team budgetbuddyde \
  -v repo_owner="budgetbuddyde" \
  -v repo_name="budgetbuddyde" \
  -v repo_branch="main" \
  -v repo_path="apps/webapp" \
  -v service="app_webapp" \
  -v service_name="webapp"

# or
fly -t ci set-pipeline -p webapp -c ./pipelines/test-webapp.pipeline.yml --team budgetbuddyde -v repo_owner="budgetbuddyde" -v repo_name="budgetbuddyde" -v repo_branch="main" -v repo_path="apps/webapp" -v service="app_webapp" -v service_name="webapp"
```

### Manage database migrations & backups

```bash
fly -t ci set-pipeline -p manage-database -c ./pipelines/manage-database.pipeline.yml \
  --team budgetbuddyde \
  -v repo_owner="budgetbuddyde" \
  -v repo_name="budgetbuddyde" \
  -v repo_path="packages/db" \
  -v service="pck_db" \
  -v service_name="db"

# or
fly -t ci set-pipeline -p manage-database -c ./pipelines/manage-database.pipeline.yml --team budgetbuddyde -v repo_owner="budgetbuddyde" -v repo_name="budgetbuddyde" -v repo_path="packages/db" -v service="pck_db" -v service_name="db"
```

### Publish `@budgetbuddyde/db`

```bash
fly -t ci set-pipeline \
    --pipeline packages \
    --config ./pipelines/publish-npm-package.pipeline.yml \
    --team budgetbuddyde \
    -v repo_owner="budgetbuddyde" \
    -v repo_name="budgetbuddyde" \
    -i repo_path="packages/db" \
    -i service="pck_db" \
    -i service_name="db"

# or
fly -t ci set-pipeline --pipeline packages --config ./pipelines/publish-npm-package.pipeline.yml --team budgetbuddyde -v repo_owner="budgetbuddyde" -v repo_name="budgetbuddyde" -i repo_path="packages/db" -i service="pck_db" -i service_name="db"
```

### Publish `@budetbuddyde/api`

```bash
fly -t ci set-pipeline \
    --pipeline packages \
    --config ./pipelines/publish-npm-package.pipeline.yml \
    --team budgetbuddyde \
    -v repo_owner="budgetbuddyde" \
    -v repo_name="budgetbuddyde" \
    -i repo_path="packages/api" \
    -i service="pck_api" \
    -i service_name="api"

# or
fly -t ci set-pipeline --pipeline packages --config ./pipelines/publish-npm-package.pipeline.yml --team budgetbuddyde -v repo_owner="budgetbuddyde" -v repo_name="budgetbuddyde" -i repo_path="packages/api" -i service="pck_api" -i service_name="api"
```

### Publish `@budetbuddyde/core`

```bash
fly -t ci set-pipeline \
    --pipeline packages \
    --config ./pipelines/publish-npm-package.pipeline.yml \
    --team budgetbuddyde \
    -v repo_owner="budgetbuddyde" \
    -v repo_name="budgetbuddyde" \
    -i repo_path="packages/core" \
    -i service="pck_core" \
    -i service_name="core"

# or
fly -t ci set-pipeline --pipeline packages --config ./pipelines/publish-npm-package.pipeline.yml --team budgetbuddyde -v repo_owner="budgetbuddyde" -v repo_name="budgetbuddyde" -i repo_path="packages/core" -i service="pck_core" -i service_name="core"
```

### Publish `@budetbuddyde/logger`

```bash
fly -t ci set-pipeline \
    --pipeline packages \
    --config ./pipelines/publish-npm-package.pipeline.yml \
    --team budgetbuddyde \
    -v repo_owner="budgetbuddyde" \
    -v repo_name="budgetbuddyde" \
    -i repo_path="packages/logger" \
    -i service="pck_logger" \
    -i service_name="logger"

# or
fly -t ci set-pipeline --pipeline packages --config ./pipelines/publish-npm-package.pipeline.yml --team budgetbuddyde -v repo_owner="budgetbuddyde" -v repo_name="budgetbuddyde" -i repo_path="packages/logger" -i service="pck_logger" -i service_name="logger"
```

### Publish `@budetbuddyde/utils`

```bash
fly -t ci set-pipeline \
    --pipeline packages \
    --config ./pipelines/publish-npm-package.pipeline.yml \
    --team budgetbuddyde \
    -v repo_owner="budgetbuddyde" \
    -v repo_name="budgetbuddyde" \
    -i repo_path="packages/utils" \
    -i service="pck_utils" \
    -i service_name="utils"

# or
fly -t ci set-pipeline --pipeline packages --config ./pipelines/publish-npm-package.pipeline.yml --team budgetbuddyde -v repo_owner="budgetbuddyde" -v repo_name="budgetbuddyde" -i repo_path="packages/utils" -i service="pck_utils" -i service_name="utils"
```

### Publish `auth-service`

```bash
fly -t ci set-pipeline -p auth-service -c ./pipelines/publish-service.pipeline.yml \
  --team budgetbuddyde \
  -v repo_owner="budgetbuddyde" \
  -v repo_name="budgetbuddyde" \
  -v repo_path="services/auth-service" \
  -v docker_image="ghcr.io/budgetbuddyde/auth-service" \
  -v service="bb_auth_service" \
  -v service_name="auth-service"

# or
fly -t ci set-pipeline -p auth-service -c ./pipelines/publish-service.pipeline.yml --team budgetbuddyde -v repo_owner="budgetbuddyde" -v repo_name="budgetbuddyde" -v repo_path="services/auth-service" -v docker_image="ghcr.io/budgetbuddyde/auth-service" -v service="bb_auth_service" -v service_name="auth-service"
```

### Publish `backend`

```bash
fly -t ci set-pipeline -p backend -c ./pipelines/publish-service.pipeline.yml \
  --team budgetbuddyde \
  -v repo_owner="budgetbuddyde" \
  -v repo_name="budgetbuddyde" \
  -v repo_path="services/backend" \
  -v docker_image="ghcr.io/budgetbuddyde/backend" \
  -v service="bb_backend" \
  -v service_name="backend"

# or
fly -t ci set-pipeline -p backend -c ./pipelines/publish-service.pipeline.yml --team budgetbuddyde -v repo_owner="budgetbuddyde" -v repo_name="budgetbuddyde" -v repo_path="services/backend" -v docker_image="ghcr.io/budgetbuddyde/backend" -v service="bb_backend" -v service_name="backend"
```

### Publish `mcp`

```bash
fly -t ci set-pipeline -p mcp -c ./pipelines/publish-service.pipeline.yml \
  --team budgetbuddyde \
  -v repo_owner="budgetbuddyde" \
  -v repo_name="budgetbuddyde" \
  -v repo_path="services/mcp" \
  -v docker_image="ghcr.io/budgetbuddyde/mcp" \
  -v service="bb_mcp" \
  -v service_name="mcp"

# or
fly -t ci set-pipeline -p mcp -c ./pipelines/publish-service.pipeline.yml --team budgetbuddyde -v repo_owner="budgetbuddyde" -v repo_name="budgetbuddyde" -v repo_path="services/mcp" -v docker_image="ghcr.io/budgetbuddyde/mcp" -v service="bb_mcp" -v service_name="mcp"
```
