---
title: Installation
description: Run BudgetBuddy locally or on your own server.
icon: Rocket
---

## Prerequisites

- **Node.js 22 or later** and **npm 11 or later**
- **Docker** (recommended, for PostgreSQL, Redis, and the Drizzle Gateway) — or your own PostgreSQL 16 and Redis 7 installations
- An **S3-compatible object storage** if you want attachments
- A **Resend API key** for transactional emails (the auth service requires one)

## 1. Clone and install

```bash
git clone https://github.com/BudgetBuddyDE/BudgetBuddyDE.git
cd BudgetBuddyDE
npm install
```

## 2. Start the infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (port 5432), Redis (port 6379, password `mycachepassword`), and the Drizzle Gateway (port 4983). The credentials in `docker-compose.yml` are development defaults; change them before exposing anything.

## 3. Create environment files

Copy the example files and adjust the values:

```bash
cp packages/db/.env.example packages/db/.env
cp services/auth-service/.env.example services/auth-service/.env
cp services/backend/.env.example services/backend/.env
cp apps/webapp/.env.example apps/webapp/.env
```

The examples already match the defaults from `docker-compose.yml`. For a local setup, make sure these values line up:

- `DATABASE_URL` points to `localhost:5432` with the compose credentials.
- `AUTH_SERVICE_HOST` in the backend points to the auth service, for example `http://localhost:8080`.
- `NEXT_PUBLIC_AUTH_SERVICE_HOST` and `NEXT_PUBLIC_BACKEND_SERVICE_HOST` point to `http://localhost:8080` and `http://localhost:9000` when you run the services directly. (The shipped example uses `http://auth.localhost` and `http://backend.localhost`, which assume a local reverse proxy.)

Every variable is documented in [Configuration](/self-hosting/configuration).

## 4. Prepare the database

```bash
npm run build-packages
npm run db:migrate --workspace @budgetbuddyde/db
```

The migration scripts read `DATABASE_URL` from `packages/db/.env`.

## 5. Run BudgetBuddy

For development:

```bash
npm run dev
```

Turbo starts the web app, backend, auth service, and MCP service. The web app is available at [http://localhost:3000](http://localhost:3000).

For production, build everything first and then start the services. See [Production](/self-hosting/production).

## 6. Verify

Check the health endpoints:

| Service     | Endpoint                           |
| ----------- | ---------------------------------- |
| Web app     | `http://localhost:3000/api/health` |
| Backend     | `http://localhost:9000/health`     |
| MCP service | `http://localhost:8070/health`     |

The backend health response also reports database and Redis connectivity. Then open the web app, sign up, and follow [Getting started](/users/getting-started).

## Next steps

- [Configuration](/self-hosting/configuration) — every environment variable
- [Production](/self-hosting/production) — go live
- [Troubleshooting](/self-hosting/troubleshooting) — if something does not work
