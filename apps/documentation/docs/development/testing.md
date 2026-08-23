---
title: Testing and Quality Assurance
description: Run tests, formatting, linting, type checks, and builds locally.
icon: lucide/test-tube-2
---

## Full Check

```bash
npm run format:check
npm run lint:check
npm run typecheck
npm test
npm run build
```

## Testing Principles

- Test observable behavior instead of implementation details.
- Check API validation, error tuples, authentication, and owner isolation.
- Check transactions, batch limits, and cache invalidation.
- Use deterministic fixtures and restore mocks after every test.
- Frontend tests use Testing Library and semantic queries.

Before a pull request, at least the affected workspace's tests and the relevant global checks should pass.
