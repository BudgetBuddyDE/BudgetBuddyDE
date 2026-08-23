---
title: Frontend Development
description: Extend the Next.js webapp, data access, and UI state.
icon: lucide/panels-top-left
---

The webapp under `apps/webapp` uses the Next.js 15 App Router, React 19, Material UI, Redux Toolkit, and the shared API client.

## Structure

- Route pages read URL and search filters and can prefetch data.
- Client components handle interaction, forms, dialogs, and tables.
- API requests go through `apps/webapp/src/apiClient.ts`.
- Entity data is managed in Redux.
- Intent-based navigation must preserve query parameters and idempotence.

New UI features require loading, empty, error, and success states. Errors should be surfaced through the existing snackbar/retry flow.
