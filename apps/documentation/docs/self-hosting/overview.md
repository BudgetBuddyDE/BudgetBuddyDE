---
title: Overview
description: Components, ports, and storage of a BudgetBuddy instance.
icon: Server
---

A BudgetBuddy instance consists of four applications and three infrastructure components.

## Applications

| Service      | Default port | Purpose                                                                                                                                 |
| ------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Web app      | 3000         | Next.js frontend; the interface your users open in the browser.                                                                         |
| Auth service | 8080         | Authentication with Better Auth: registration, login, sessions, emails, API keys.                                                       |
| Backend      | 9000         | Domain API: transactions, recurring payments, budgets, insights, attachments, import/export. Also runs the daily recurring-payment job. |
| MCP service  | 8070         | Model Context Protocol endpoint for LLM clients, authenticated with API keys. Optional.                                                 |

## Infrastructure

| Component                    | Default port | Purpose                                                                                            |
| ---------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| PostgreSQL 16                | 5432         | All persistent data.                                                                               |
| Redis 7                      | 6379         | Sessions (optional), response cache, rate limiting (optional).                                     |
| S3-compatible object storage | —            | Attachment files. Required only if users should upload attachments.                                |
| Drizzle Gateway              | 4983         | Optional; remote Drizzle Studio for inspecting the database. Part of the development compose file. |

## How the pieces interact

```text
Browser
  │
  ▼
Web app (3000) ──────────────► Auth service (8080) ─────► PostgreSQL / Redis
  │                                   ▲
  ▼                                   │ session validation
Backend (9000) ───────────────────────┘
  │            │
  │            └──► S3-compatible storage (attachments)
  ▼
PostgreSQL / Redis

LLM client ──► MCP service (8070) ──► Backend
```

- The web app talks to the auth service for sign-in and session handling and to the backend for all domain data.
- The backend validates every request against the auth service (`AUTH_SERVICE_HOST`).
- The MCP service is a thin layer over the backend and authenticates requests with API keys.

## The role of Redis

Redis is optional, but recommended. Without it:

- Sessions are stored in PostgreSQL instead of Redis (still works, just more database load).
- The backend response cache is disabled (more database load).
- Production rate limiting is disabled, because it relies on Redis.

## Hosted vs. self-hosted

The hosted service at `app.budget-buddy.de` runs the same components. When you self-host, you decide the domain, the email delivery, the object storage, and who can register. Everything described in the [user guide](/users/getting-started) works the same way.

## Next step

- [Installation](/self-hosting/installation)
