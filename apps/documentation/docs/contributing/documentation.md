---
title: Edit the Documentation
description: Maintain and locally check the Fumapress documentation.
icon: BookMarked
---

The source files are under `apps/documentation/docs`. Fumapress generates the site from Markdown and the Fumapress configuration.

## Work Locally

```bash
npm run dev --workspace=@budgetbuddyde/documentation
```

For a production build:

```bash
npm run build --workspace=@budgetbuddyde/documentation
```

## Writing Rules

- Each page covers a clear topic.
- State the audience and prerequisites at the beginning.
- Show commands completely and in the correct order.
- Do not use credentials or real financial data.
- Update affected reference pages when code changes.
- Link to source files, tests, and further reading.

Do not edit the generated output under `apps/documentation/dist` manually.
