\*\*\*\*# CI

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

### Test & build `webapp`

```bash
fly -t kleithor set-pipeline -p bb-webapp -c ./ci/pipelines/build-webapp.pipeline.yml -v repo_uri="git@github.com:budgetbuddyde/budgetbuddyde.git" -v repo_private_key="$(cat ./ci/secrets/github/id_rsa)" -v repo_path="apps/webapp" -v discord_webhook="$(cat ./ci/secrets/discord-webhook.txt)"
```

### Publish `@budetbuddyde/types`

```bash
fly -t kleithor set-pipeline -p bb-types -c ./ci/pipelines/publish-npm-package.pipeline.yml -v repo_uri="git@github.com:budgetbuddyde/budgetbuddyde.git" -v repo_private_key="$(cat ./ci/secrets/github/id_rsa)" -v repo_path="packages/types" -v version_bucket="$(cat ./ci/secrets/aws/bucket.txt | sed -n '3p')" -v service="pck_types" -v service_name="types" -v version_bucket_region="$(cat ./ci/secrets/aws/bucket.txt | sed -n '4p')" -v version_bucket_access_key="$(cat ./ci/secrets/aws/bucket.txt | sed -n '1p')" -v version_bucket_secret="$(cat ./ci/secrets/aws/bucket.txt | sed -n '2p')" -v npm_token="$(cat ./ci/secrets/npmjs/npm_token)"
```

### Publish `@budetbuddyde/utils`

```bash
fly -t kleithor set-pipeline -p bb-utils -c ./ci/pipelines/publish-npm-package.pipeline.yml -v repo_uri="git@github.com:budgetbuddyde/budgetbuddyde.git" -v repo_private_key="$(cat ./ci/secrets/github/id_rsa)" -v repo_path="packages/utils" -v version_bucket="$(cat ./ci/secrets/aws/bucket.txt | sed -n '3p')" -v service="pck_utils" -v service_name="utils" -v version_bucket_region="$(cat ./ci/secrets/aws/bucket.txt | sed -n '4p')" -v version_bucket_access_key="$(cat ./ci/secrets/aws/bucket.txt | sed -n '1p')" -v version_bucket_secret="$(cat ./ci/secrets/aws/bucket.txt | sed -n '2p')" -v npm_token="$(cat ./ci/secrets/npmjs/npm_token)"
```

### Publish `pocketbase`

```bash
fly -t kleithor set-pipeline -p bb-pocketbase -c ./ci/pipelines/publish-go-service.pipeline.yml -v repo_uri="git@github.com:budgetbuddyde/budgetbuddyde.git" -v repo_private_key="$(cat ./ci/secrets/github/id_rsa)" -v repo_path="services/pocketbase" -v docker_image="ghcr.io/budgetbuddyde/pocketbase" -v docker_username="tklein1801" -v docker_password="$(cat ./ci/secrets/github/pat)" -v version_bucket="$(cat ./ci/secrets/aws/bucket.txt | sed -n '3p')" -v service="bb_pocketbase" -v service_name="pocketbase" -v version_bucket_region="$(cat ./ci/secrets/aws/bucket.txt | sed -n '4p')" -v version_bucket_access_key="$(cat ./ci/secrets/aws/bucket.txt | sed -n '1p')" -v version_bucket_secret="$(cat ./ci/secrets/aws/bucket.txt | sed -n '2p')"
```

### Publish `auth-service`

```bash
fly -t kleithor set-pipeline -p bb-auth-service -c ./ci/pipelines/publish-auth-service.pipeline.yml -v repo_uri="git@github.com:budgetbuddyde/budgetbuddyde.git" -v repo_private_key="$(cat ./ci/secrets/github/id_rsa)" -v repo_path="services/auth-service" -v docker_image="ghcr.io/budgetbuddyde/auth-service" -v docker_username="tklein1801" -v docker_password="$(cat ./ci/secrets/github/pat)" -v version_bucket="$(cat ./ci/secrets/aws/bucket.txt | sed -n '3p')" -v service="bb_auth_service" -v service_name="auth-service" -v version_bucket_region="$(cat ./ci/secrets/aws/bucket.txt | sed -n '4p')" -v version_bucket_access_key="$(cat ./ci/secrets/aws/bucket.txt | sed -n '1p')" -v version_bucket_secret="$(cat ./ci/secrets/aws/bucket.txt | sed -n '2p')"
```

### Publish `stock-service`

```bash
fly -t kleithor set-pipeline -p bb-stock-service -c ./ci/pipelines/publish-node-service.pipeline.yml -v repo_uri="git@github.com:budgetbuddyde/budgetbuddyde.git" -v repo_private_key="$(cat ./ci/secrets/github/id_rsa)" -v repo_path="services/stock-service" -v docker_image="ghcr.io/budgetbuddyde/stock-service" -v docker_username="tklein1801" -v docker_password="$(cat ./ci/secrets/github/pat)" -v version_bucket="$(cat ./ci/secrets/aws/bucket.txt | sed -n '3p')" -v service="bb_stock_service" -v service_name="stock-service" -v version_bucket_region="$(cat ./ci/secrets/aws/bucket.txt | sed -n '4p')" -v version_bucket_access_key="$(cat ./ci/secrets/aws/bucket.txt | sed -n '1p')" -v version_bucket_secret="$(cat ./ci/secrets/aws/bucket.txt | sed -n '2p')"
```

### Publish `mail-service`

```bash
fly -t kleithor set-pipeline -p bb-mail-service -c ./ci/pipelines/publish-node-service.pipeline.yml -v repo_uri="git@github.com:budgetbuddyde/budgetbuddyde.git" -v repo_private_key="$(cat ./ci/secrets/github/id_rsa)" -v repo_path="services/mail-service" -v docker_image="ghcr.io/budgetbuddyde/mail-service" -v docker_username="tklein1801" -v docker_password="$(cat ./ci/secrets/github/pat)" -v version_bucket="$(cat ./ci/secrets/aws/bucket.txt | sed -n '3p')" -v service="bb_mail_service" -v service_name="mail-service" -v version_bucket_region="$(cat ./ci/secrets/aws/bucket.txt | sed -n '4p')" -v version_bucket_access_key="$(cat ./ci/secrets/aws/bucket.txt | sed -n '1p')" -v version_bucket_secret="$(cat ./ci/secrets/aws/bucket.txt | sed -n '2p')"
```
