---
title: Architecture
description: Concourse instance, Vault credential manager, and resources.
icon: Network
---

Concourse runs at `https://ci.tklein.it`. All pipelines belong to the `budgetbuddyde` team. Pipeline definitions live in `ci/pipelines/` as reusable templates; per-workspace values are passed as variables and secrets are resolved from HashiCorp Vault.

## HashiCorp Vault credential manager

Concourse is configured with Vault as its credential manager. Any `((name))` reference in a pipeline definition that is not passed as a plain variable resolves from Vault when the step runs:

- Lookup order: `/concourse/budgetbuddyde/<pipeline>/<name>`, then `/concourse/budgetbuddyde/<name>`.
- Credentials are key-value pairs: a dot addresses a field, so `((github.private_key))` reads the `private_key` field of the secret `github`.
- Secrets are never persisted in build plans and never appear in `fly get-pipeline` output.

Variables passed with `fly -v` (such as `repo_path` or `service_name`) are plain configuration; secrets are passed by the `((...))` references below and live only in Vault.

### Secret inventory

| Reference                                                                                                                | Vault secret / field                                         | Used by                                      |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------- |
| `((github.private_key))`                                                                                                 | `github` / `private_key`                                     | Git resource (read access to the repository) |
| `((github.pat))`                                                                                                         | `github` / `pat`                                             | Commit status resource (cogito)              |
| `((s3-versions.bucket))`, `((s3-versions.region))`, `((s3-versions.access_key_id))`, `((s3-versions.access_key_secret))` | `s3-versions`                                                | Version state for the semver resources       |
| `((s3-db-backup.*))`                                                                                                     | `s3-db-backup`                                               | Daily database backups                       |
| `((discord.webhook_url))`                                                                                                | `discord` / `webhook_url`                                    | Failed release notifications                 |
| `((npm_token))`                                                                                                          | `npm_token`                                                  | npm publishing                               |
| `((manage-database.test-database-url))`, `((manage-database.prod-database-url))`                                         | `manage-database` / `test-database-url`, `prod-database-url` | Database migrations                          |

## Resources

| Resource type    | Provides                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| `git`            | Repository checkouts filtered by `repo_path`, authenticated with the deploy key                           |
| `registry-image` | Pinned Node.js 24.21.0 LTS image for build tasks                                                          |
| `semver`         | Versions stored in S3, used for release candidates and final releases                                     |
| `s3`             | Database backup bucket (`backup_*.dump`)                                                                  |
| `time`           | Daily trigger for database backups                                                                        |
| `cogito`         | GitHub commit statuses for build jobs                                                                     |
| `discord-alert`  | Notifications on failed releases (custom type from `ghcr.io/tklein1801/concourse-discord-alert-resource`) |

## Flow

```text
                    ┌──────────────────────┐
                    │ HashiCorp Vault      │
                    │ /concourse/          │
                    │   budgetbuddyde/...  │
                    └──────────┬───────────┘
                               │ ((secrets)) at runtime
                               ▼
┌──────────────┐    ┌──────────────────────────────────────────┐
│ GitHub repo  │    │ Concourse CI (ci.tklein.it)              │
│ budgetbuddyde│───►│ team budgetbuddyde                       │
│   /main      │    │                                          │
└──────────────┘    │  build-*            release-*            │
        ▲           │  npm test/build  →  minor/major/patch    │
        │           │                                          │
        │           │  update-test-database → update-prod-db   │
        │           │  database-backup (daily timer)           │
        │           └───┬────────┬────────┬───────────────────┘
        │               │        │        │
        │  release      │        │        │
        │  commits      ▼        ▼        ▼
        │  + tags   npm      S3       PostgreSQL
        └─────────  registry versions  test → prod
                       │
                       │  status / alerts
                       ▼
              GitHub commit statuses · Discord
```

## Related pages

- [Pipelines](/ci/pipelines) — what each template builds
- [Operating](/ci/operating) — creating pipelines with `fly`
