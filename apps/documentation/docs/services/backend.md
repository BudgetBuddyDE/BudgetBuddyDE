# Backend

## Overview 

![CI Build Status](https://ci.tklein.it/api/v1/teams/budgetbuddyde/pipelines/backend/jobs/build-backend/badge?title=Build)
![Version](https://img.shields.io/github/v/tag/budgetbuddyde/budgetbuddyde?filter=backend*&cacheSeconds=3600)

The Backend is based on Node.js with the Express.js Framework and is written in TypeScript. It provides a RESTful API that is used by the frontend application and other services.
Most requests to the endpoints are authenticated and authorized by the [auth-service](./auth-service.md) to ensure that only authorized users have access to protected resources.
The current user session is also integrated into the request context and the result set is filtered according to the user.

## Features

- **RESTful API** for providing data and business logic
- **Processing of Recurring Payments** using a job

### Jobs

#### `process-recurring-payments`

Scheduled at: `30 1 * * *` (daily at 01:30 AM) in the timezone `Europe/Berlin`.

This job processes due recurring payments and creates corresponding transactions. It also takes into account months with fewer than 31 days by executing payments for non-existent calendar days at the end of the month. Paused payments are skipped and the entire process is logged.

## Architecture

### Technologies

- **Framework**: [Express.js](https://github.com/expressjs/express)
- **Language**: [TypeScript](https://github.com/microsoft/TypeScript)
- **Database**: [PostgreSQL](https://github.com/postgres/postgres)
- **Cache**: [Redis](https://github.com/redis/redis)

### Structure

Explain briefly the folder structure or important modules of the service.

```txt
src/
├── db/        # Contains database models and adapters to access the database
├── jobs/        # Contains functions for background jobs
├── lib/        # Contains library functions and initializations
├── middleware/        # Contains Express middleware functions
├── models/        # Providing classes and interfaces
├── types/        # Providing types and
├── config.ts        # Configuration file for the service
├── server.ts        # Main entry point of the application
```

### API Documentation

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

| Variable            | Description                                           | Default Value       |
|:--------------------|:------------------------------------------------------|:--------------------|
| `NODE_ENV`          | Execution environment (development, production, test) | `development`       |
| `DATABASE_URL`      | Connection string to the database                     | -                   |
| `REDIS_URL`         | Connection string for Redis cache                     | -                   |
| `REDIS_DB`          | Index of the Redis database                           | `1`                 |
| `TRUSTED_ORIGINS`   | Comma-separated list of trusted origins for CORS      | -                   |
| `AUTH_SERVICE_HOST` | Host URL under which the Auth Service is reachable    | -                   |
| `LOG_LEVEL`         | Log level for the application                         | `info`              |
| `LOG_HIDE_META`     | Whether to hide metadata in logs                      | `false`             |
| `TIMEZONE`          | Timezone for the application (for scheduling jobs)    | `Europe/Berlin`     |
| `PORT`              | Port on which the service runs                        | `9000`              |
| `LOKI_URL`          | URL for the Loki logging service                      | `http://loki:3100`  |
| `TEMPO_URL`         | Ingest URL for the Tempo tracing service              | `http://tempo:4318` |



> [!IMPORTANT]
>   The environment variable `TEMPO_URL` is only required if the server is started with tracing functionality (via instrumentation.js or `npm run start:instrumentation`) and logs are to be transmitted.
> If the environment variable `LOKI_URL` is not set, logs will be output "locally" to the console.

## Deployment

Information about the deployment process (e.g. Docker, CI/CD Pipelines).

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

The Backend Service uses the following internal packages:

- [`@budgetbuddyde/db`](../packages/db.md)
- [`@budgetbuddyde/logger`](../packages/logger.md)
- [`@budgetbuddyde/types`](../packages/types.md)
- [`@budgetbuddyde/utils`](../packages/utils.md)

and requires the following external services:

- [Resend](https://resend.com/) for sending emails