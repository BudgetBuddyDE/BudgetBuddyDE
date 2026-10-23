---
title: Overview
description: Project validation, dependency updates, database migrations, and backups.
icon: Workflow
---

BudgetBuddyDE uses Concourse CI for project-wide validation and database maintenance.
The current definitions live directly in `ci/`, with reusable tasks in `ci/tasks/`.

## What Concourse does

- Validates, tests, and builds all pnpm workspaces when a new commit is detected on `main`.
- Runs the same verification for GitHub pull requests and reports their status.
- Reports main build statuses to GitHub through Cogito.
- Updates development dependencies weekly or manually, validates changes, and pushes successful updates to `main`.
- Applies database migrations to test first; production migrations require a manual build using a version that passed test.
- Creates daily PostgreSQL backups and uploads them to S3.

There is currently no automatic versioning, Git tag creation, npm publishing, Docker image publishing, or deployment. Existing tags and S3 version data are not removed. S3 is still used for database backups.

## Documentation

- [Architecture](/ci/architecture) - resources, Git access, and Vault credentials.
- [Pipelines](/ci/pipelines) - the project and database pipelines and their jobs.
- [Operating](/ci/operating) - validation, configuration, and manual job execution with `fly`.

The historical `.ci/` templates have been removed. Repository changes do not update or remove live Concourse pipelines; operators must apply the definitions and retire obsolete pipelines explicitly.

## Related pages

- [Developer setup](/developers/getting-started)
- [Workspaces](/developers/workspaces)
