---
title: Overview
description: How BudgetBuddyDE is validated, built, versioned, and released.
icon: Workflow
---

BudgetBuddyDE uses Concourse CI to validate, build, version, and release the project.

## What Concourse does

Concourse watches the `main` branch and turns merged changes into released artifacts:

- npm packages, published to the public registry.
- Version bumps, Git tags, and release commits pushed back to the repository.
- Database migrations, applied to the test database first and to production after passing.
- Daily PostgreSQL backups.

All pipelines are parameterized templates; credentials are resolved from HashiCorp Vault at runtime. Details:

- [Architecture](/ci/architecture) — Concourse instance, Vault credential manager, resources
- [Pipelines](/ci/pipelines) — the four pipeline templates and their jobs
- [Operating](/ci/operating) — team, `fly` CLI, creating and updating pipelines

## Related pages

- [Developer setup](/developers/getting-started)
- [Workspaces](/developers/workspaces)
