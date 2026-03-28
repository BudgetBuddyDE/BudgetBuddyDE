---
title: Git Hooks
description: Overview of automated Git hooks that run quality checks before commits.
icon: lucide/git-branch
status: new
tags: [development, git, hooks, automation]
---

# Git Hooks

Git hooks are automatically set up using [Husky](https://typicode.github.io/husky/) and run quality checks on your code changes before they are committed to the repository.

## Pre-commit Hook

The pre-commit hook runs **automatically before every commit** and executes workspace-specific quality checks using [lint-staged](https://github.com/okonet/lint-staged).

### What Gets Checked

When you commit changes, the hook identifies which workspace packages have been modified and runs the appropriate checks:

| Workspace | Commands |
|-----------|----------|
| `apps/webapp` | `npm run check` + `npm run test` + `npm run typecheck` |
| `packages/api` | `npm test` |
| `packages/db` | `npm test` |
| `packages/types` | `npm test` |
| `packages/logger` | `npm test` |
| `packages/utils` | `npm test` |
| `services/auth-service` | `npm test` + `npm run build` |
| `services/backend` | `npm test` + `npm run build` |

### Skipping Hooks in CI Environments

The Git hooks are **automatically disabled in CI environments** to prevent duplicate checks. The hook checks for the following environment variables:

- `CI` - Set to any value in most CI systems (GitHub Actions, GitLab CI, CircleCI, etc.)
- `GITHUB_ACTIONS` - Set to `true` in GitHub Actions specifically

If either variable is detected, the hook exits immediately without running any checks. This prevents:

- Slowing down CI pipelines with duplicate checks
- Causing unnecessary failures due to environment differences

### Configuration

The hook configuration is defined in two files:

- **`.husky/pre-commit`** - The Git hook entry point that delegates to lint-staged
- **`.lintstagedrc.json`** - Workspace-specific rules that determine which commands run for each package

### Debugging Hooks

If you need to **bypass the hook temporarily** during development, you can use the `--no-verify` flag:

```bash
git commit --no-verify
```

!!! warning "Use with caution"
    Bypassing hooks should only be done temporarily for debugging purposes. Always ensure your code passes checks before pushing to a shared branch.

### Modifying Hooks

To add or modify checks for a workspace:

1. Edit the glob patterns and commands in `.lintstagedrc.json`
2. The changes take effect immediately on the next commit

Example: To add a linting step for `packages/utils`:

```json
"packages/utils/**/*": ["cd packages/utils && npm run lint && npm test"]
```

---

**Learn more:** See [Starting Development](start-development.md) to get your environment set up.
