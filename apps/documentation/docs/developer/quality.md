---
title: Quality and automation
description: Tests, checks, CI/CD, and release requirements.
icon: lucide/shield-check
status: active
tags: [developer, quality, ci-cd]
---

# Quality and automation

Before opening a pull request, run the checks relevant to the changed workspace. The full local CI sequence is:

```bash
npm ci
npm run format:check
npm run lint:check
npm run typecheck
npm test
npm run build
```

CI runs formatting, linting, typechecking, tests, and builds through Turborepo. Builds are grouped by packages, services, and apps so failures can be isolated to the affected workspace type.

Releases must include migration notes for persistent data, update affected internal package consumers, and preserve the root lockfile rule. See the existing [CI/CD reference](../ci-cd.md) for pipeline-specific details.
