---
title: CI/CD
icon: lucide/terminal
tags: [ci/cd]
---

## Overview

BudgetBuddyDE uses [Concourse CI](https://concourse-ci.org/) for continuous integration and delivery. All pipelines are defined as code and versioned within the repository.

- **CI Instance**: [https://ci.tklein.it](https://ci.tklein.it)
- **Pipeline Definitions**: Located in the `ci/pipelines/` directory.

## Access

Access to the `budgetbuddyde` team on Concourse is automatically granted to all members of the BudgetBuddyDE GitHub organization.

## Key Pipelines

- **Database**: Manages database migrations and schema validation.
- **Backend/Auth Service**: Handles building, testing, and publishing docker images.
- **Webapp**: Automates testing and deployment of the main web application.
- **NPM Packages**: Manages versioning and publication of shared libraries (e.g., `@budgetbuddyde/db`).

## Deployment Strategy

1. **Build**: On every push to the `main` branch, the corresponding pipeline is triggered to build and test the project.
2. **Release Candidates**: Successful builds are tagged as release candidates.
3. **Manual Release**: Production releases are triggered manually via the Concourse dashboard after verifying the RC builds.
