# Webapp 

## Overview

![version](https://img.shields.io/github/v/tag/budgetbuddyde/budgetbuddyde?filter=webapp*&cacheSeconds=3600)

The Webapp is the main application of BudgetBuddyDE, providing users with an intuitive and user-friendly interface to manage their finances. It is based on Next.js with TypeScript and uses the [auth-service](../services/auth-service.md) as well as the [backend](../services/backend.md) to process and store data.

## Features

### Authentication

- User registration and login
- Password reset via email
- Email verification after registration
- OAuth2 login (Google, Github)

### Budgeting

- Create and manage budgets
- Categorization of expenses
- Visualization of expenses and income
- Monthly reports and analytics (upcoming)

## Architecture

### Technologies

- Framework: [Next.js](https://github.com/nextjs/next.js)
- UI Library: [Material UI](https://mui.com/)
- Language: [TypeScript](https://github.com/microsoft/TypeScript)

### API

| Method | Path        | Description     |
|--------|-------------|-----------------|
| GET    | /api/health | Health endpoint |

## Development

### Start locally

```bash
# Install dependencies
npm install
 
# Start in development mode
npm run dev
```

### Lint & Format

```bash
# Check linter
npm run check
 
# Automatically fix linter errors
npm run check:write
 
# Format code
npm run format
```

### Configuration

#### Environment Variables

| Variable                           | Description                              | Default value       |
|------------------------------------|------------------------------------------|---------------------|
| `NEXT_PUBLIC_AUTH_SERVICE_HOST`    | Host URL of the Auth-Service             | `undefined`         |
| `NEXT_PUBLIC_BACKEND_SERVICE_HOST` | Host URL of the Backend-Service          | `undefined`         |
| `TEMPO_URL`                        | Ingest URL for the Tempo tracing service | `http://tempo:4318` |
| `NEXT_OTEL_VERBOSE`                | Enable verbose OpenTelemetry tracing     | `undefined`         |

> [!NOTE]
> The environment variable `TEMPO_URL` is only required if the server is started with tracing functionality. Next.js traces more spans than are emitted by default. To see more spans, you must set `NEXT_OTEL_VERBOSE=1`.

For more information on setting up OpenTelemetry for Next.js, refer to the [official documentation](https://nextjs.org/docs/15/app/guides/open-telemetry).

## Deployment

The service is automatically deployed via a Railway CI/CD pipeline on every push to the `main` branch.

### Dependencies

The Webapp uses the following internal packages:

- [@tklein1801/logger.js](https://www.npmjs.com/package/@tklein1801/logger.js/v/0.0.1)
- [@budgetbuddyde/api](../packages/api.md)
- [@budgetbuddyde/db](../packages/db.md)

and requires the following internal services:

- [Auth-Service](../services/auth-service.md)
- [Backend](../services/backend.md)

### Railway

BudgetBuddyDE is designed to be easily deployable on [Railway](https://railway.app/).

[![Railway Logo](https://railway.com/button.svg)](https://railway.com/deploy/WjE5vD?referralCode=SD-6Xm&utm_medium=integration&utm_source=template&utm_campaign=generic)