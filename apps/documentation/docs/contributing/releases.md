---
title: Releases
description: Versions, migrations, and publishable packages.
icon: lucide/tag
---

Before a release, review the changelog, build, tests, and migration notes. Changes to public packages must account for API compatibility and consumers.

## Release Checklist

- Relevant changes recorded in the changelog
- Versions and internal consumers reviewed
- Lockfile updated if necessary
- Migrations run in a test environment
- `npm run ci` completed successfully
- Deployment and rollback prepared

The specific release process is defined by repository automation and the maintainers.
