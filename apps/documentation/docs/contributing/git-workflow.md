---
title: Git-Workflow
description: Branches, commits, and local checks.
icon: lucide/git-pull-request
---

## Workflow

1. Update your local checkout.
2. Create a focused branch.
3. Implement the change with tests and documentation.
4. Run the relevant checks.
5. Create a pull request with context and test evidence.

Commit messages should follow Conventional Commits where possible, for example `feat: add budget filters` or `fix: scope attachment lookup`.

Local hooks may run additional checks. Do not remove them to bypass errors.
