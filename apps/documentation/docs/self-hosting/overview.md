---
title: Overview
description: Components, ports, and storage of a BudgetBuddy instance.
icon: Server
---

A BudgetBuddy instance consists of a web app, a backend with integrated authentication, and an optional MCP service.

## Applications

| Service     | Default port | Purpose                                                                                                |
| ----------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| Web app     | 3000         | Next.js frontend.                                                                                      |
| Backend     | 9000         | Better Auth at `/api/auth/*`, domain API, imports/exports, attachments, and the recurring-payment job. |
| MCP service | 8070         | Optional Model Context Protocol endpoint for LLM clients authenticated with API keys.                  |

## Infrastructure

| Component                    | Default port | Purpose                                                          |
| ---------------------------- | ------------ | ---------------------------------------------------------------- |
| PostgreSQL 16                | 5432         | Auth and domain schemas in one database.                         |
| Redis 7                      | 6379         | Optional session storage, response cache, and rate limiting.     |
| S3-compatible object storage | N/A          | Attachment files, required for attachment uploads.               |
| Drizzle Gateway              | 4983         | Optional remote Drizzle Studio, included in development Compose. |

## How the pieces interact

```text
Browser → Web app (3000) → Backend (9000)
                          ├─ /api/auth/*: Better Auth
                          ├─ /api/*: domain API
                          ├─ PostgreSQL: auth and domain data
                          ├─ Redis: sessions, cache, rate limits
                          └─ S3-compatible attachment storage

LLM client → MCP service (8070) → Backend
```

The web app uses one public backend URL for authentication and domain requests. The backend validates cookies and API keys using its local Better Auth instance. MCP forwards the caller's API key to the backend.

## The role of Redis

Auth and cache connections are independent. `AUTH_REDIS_URL` with `AUTH_REDIS_DB` (default `0`) stores auth sessions and supports auth HTTP rate limiting. Without auth Redis, sessions use PostgreSQL. Auth HTTP rate limits use auth Redis when available, otherwise cache Redis. `REDIS_URL` with `REDIS_DB` (default `1`) enables backend response caching and domain rate limiting.

Both URLs may point to the same Redis server with separate database indices. Configuring only cache Redis does not enable auth Redis.

## Hosted vs. self-hosted

When you self-host, you choose domains, email delivery, object storage, and registration policy. Existing installations should follow the [authentication cutover instructions](/self-hosting/updating#integrated-authentication-cutover).

## Next step

- [Installation](/self-hosting/installation)
