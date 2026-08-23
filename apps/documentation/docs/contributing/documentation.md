---
title: Edit the Documentation
description: Maintain and locally check the Zensical documentation.
icon: lucide/book-marked
---

The source files are under `apps/documentation/docs`. Zensical generates the site from Markdown and `apps/documentation/zensical.toml`.

## Work Locally

```bash
cd apps/documentation
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
zensical serve
```

For a production build:

```bash
zensical build
```

## Writing Rules

- Each page covers a clear topic.
- State the audience and prerequisites at the beginning.
- Show commands completely and in the correct order.
- Do not use credentials or real financial data.
- Update affected reference pages when code changes.
- Link to source files, tests, and further reading.

Do not edit the generated output under `apps/documentation/site` manually.
