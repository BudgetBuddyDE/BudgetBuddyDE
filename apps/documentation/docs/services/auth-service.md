---
title: Auth Service
icon: lucide/container
tags: 
    - service
    - auth
---

## Overview

![CI Build Status](https://ci.tklein.it/api/v1/teams/budgetbuddyde/pipelines/auth-service/jobs/build-auth-service/badge?title=Build)
![Version](https://img.shields.io/github/v/tag/budgetbuddyde/budgetbuddyde?filter=auth-service*&cacheSeconds=3600)

The Auth Service is based on Express.js and TypeScript. The authentication logic was implemented using the [Better-Auth](https://better-auth.com/) library. This allows the service to be connected to other OAuth2 and OpenID Connect compatible identity providers with little effort. Additionally, there is the possibility to install plugins to use further features such as Two-Factor Authentication.
Currently, users can log in and authenticate using an Email/Password combination or via a Github or Google account.

## Features

- **Login and Registration** of users using Email/Password combination
- **Login and Registration** of users via OAuth2 (Google, Github)
- **Management of user sessions** (as well as creating sessions on multiple devices)
- **Password reset** via Email
- **Email verification** after registration

## Architecture

### Technologies

- **Framework**: [Express.js](https://github.com/expressjs/express)
- **Language**: [TypeScript](https://github.com/microsoft/TypeScript)
- **Database**: [PostgreSQL](https://github.com/postgres/postgres)
- **Cache**: [Redis](https://github.com/redis/redis)
- **Authentication Library**: [Better-Auth](https://github.com/better-auth/better-auth)

### Structure

```txt
src/
├── db/        # Contains database models and adapters to access the database
├── lib/        # Contains library functions and initializations
├── middleware/        # Contains Express middleware functions
├── models/        # Providing classes and interfaces
├── types/        # Providing types and
├── utils/        # Contains helper functions and utility modules
├── auth.ts        # Instantiation and configuration of the Better-Auth library
├── config.ts        # Configuration file for the service
├── server.ts        # Main entry point of the application
```

### API Documentation

The documentation of [Better-Auth](https://better-auth.com/) can be viewed [here](https://better-auth.com/docs/).

| Method | Path      | Description           |
|:-------|:----------|:----------------------|
| GET    | `/health` | Health Check Endpoint |

## Development

**Start service locally**

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start in development mode
npm run dev
```

**Linting & Formatting**

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

| Variable               | Description                                                        | Default Value       |
|:-----------------------|:-------------------------------------------------------------------|:--------------------|
| `DATABASE_URL`         | Connection string to the database                                  | -                   |
| `REDIS_URL`            | Connection string for Redis cache                                  | -                   |
| `TRUSTED_ORIGINS`      | Comma-separated list of trusted origins for CORS                   | -                   |
| `AUTH_SECRET`          | Random string to secure authentication                             | -                   |
| `BASE_URL`             | Host URL of the service to e.g. generate links in emails correctly | -                   |
| `BACKEND_HOST_URL`     | Host URL under which the backend is reachable                      | -                   |
| `RESEND_API_KEY`       | Resend API to send emails via Resend                               | -                   |
| `LOG_LEVEL`            | Log level for the application                                      | `info`              |
| `LOG_HIDE_META`        | Whether to hide metadata in logs                                   | `false`             |
| `GITHUB_CLIENT_ID`     | GitHub OAuth Client ID                                             | -                   |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret                                         | -                   |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID                                             | -                   |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret                                         | -                   |
| `PORT`                 | Port on which the service runs                                     | `8080`              |
| `LOKI_URL`             | URL for the Loki logging service                                   | `http://loki:3100`  |
| `TEMPO_URL`            | Ingest URL for the Tempo tracing service                           | `http://tempo:4318` |

!!! note
    The environment variable `TEMPO_URL` is only required if the server is started with tracing functionality (via instrumentation.js or `npm run start:instrumentation`) and logs are to be transmitted.
    If the environment variable `LOKI_URL` is not set, logs will be output "locally" to the console.

#### Rate Limiting

Rate limiting is active **in production only** (`runtime === "production"`) and is backed by Redis.

The limits are configured in `config.ts`:

| Parameter   | Value      | Description                           |
|:------------|:-----------|:--------------------------------------|
| `windowMs`  | 5 minutes  | Time window for rate limit tracking   |
| `limit`     | 500        | Maximum requests per IP per window    |

!!! info
    The rate limit for the auth service is higher than the defined limit for the [backend](./backend.md#rate-limiting){data-preview} due to the increased traffic caused by the webapp.

When the limit is exceeded, the service responds with HTTP `429 Too Many Requests`. Standard `RateLimit-*` headers (draft-7) are included in every response.

#### OAuth

The callback URLs for the OAuth providers must be configured as follows:

=== "Local"

    ```
    http://localhost:8080/api/auth/callback/<PROVIDER> # e.g. google, github
    ```

=== "Production"

    ```
    https://auth.service/api/auth/callback/<PROVIDER> # e.g. google, github
    ```

## Deployment

The service is automatically deployed via a Railway CI/CD pipeline on every push to the `main` branch.
Additionally, there is a [Concourse Workflow](https://ci.tklein.it/teams/budgetbuddyde/pipelines/auth-service), which tests the service on every push and builds and publishes a Docker image.

### Docker

The service can be containerized and deployed using the Dockerfile in the repository.
The following command can be used for this:

```bash
docker pull ghcr.io/budgetbuddyde/backend:latest
docker run -d -p 9000:9000 --env-file ./path/to/env/file ghcr.io/budgetbuddyde/backend:latest
```

Additionally, a `docker-compose.yml` file is available in the repository, which can be used to start the service locally together with a PostgreSQL and Redis instance.

### Railway

BudgetBuddyDE is designed to be easily deployable on [Railway](https://railway.app/).

[![Railway Logo](https://railway.com/button.svg)](https://railway.com/deploy/WjE5vD?referralCode=SD-6Xm&utm_medium=integration&utm_source=template&utm_campaign=generic)

## Dependencies

The Auth Service uses the following internal packages:

- [@budgetbuddyde/db](../packages/db.md)
- [@budgetbuddyde/logger](../packages/logger.md)
- [@budgetbuddyde/types](../packages/types.md)
- [@budgetbuddyde/utils](../packages/utils.md)
