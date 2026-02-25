---
title: Website
icon: lucide/globe
---

## Overview

![version](https://img.shields.io/github/v/tag/budgetbuddyde/budgetbuddyde?filter=website*&cacheSeconds=3600)

## Architecture

### Technologies

- Framework: [Next.js](https://github.com/nextjs/next.js)
- Library: [Fumadocs](https://github.com/fuma-nama/fumadocs)
- Language: [TypeScript](https://github.com/microsoft/TypeScript)

## Development

### Start locally

```bash
# Install dependencies
npm install
 
# Start in development mode
npm run dev
```

### Configuration

#### Environment Variables

| Variable                           | Description                              | Default value       |
|------------------------------------|------------------------------------------|---------------------|
| `TEMPO_URL`                        | Ingest URL for the Tempo tracing service | `http://tempo:4318` |
| `NEXT_OTEL_VERBOSE`                | Enable verbose OpenTelemetry tracing     | `undefined`         |

!!! note
    The environment variable `TEMPO_URL` is only required if the server is started with tracing functionality. Next.js traces more spans than are emitted by default. To see more spans, you must set `NEXT_OTEL_VERBOSE=1`.
    !!! important
        Tracing is currently disabled for the website due to high resource consumption and no real benefit of tracing the website.

For more information on setting up OpenTelemetry for Next.js, refer to the [official documentation](https://nextjs.org/docs/15/app/guides/open-telemetry).

## Deployment

The service is automatically deployed via a Railway CI/CD pipeline on every push to the `main` branch.

### Railway

BudgetBuddyDE is designed to be easily deployable on [Railway](https://railway.app/).

[![Railway Logo](https://railway.com/button.svg)](https://railway.com/deploy/WjE5vD?referralCode=SD-6Xm&utm_medium=integration&utm_source=template&utm_campaign=generic)