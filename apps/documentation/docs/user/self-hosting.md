---
title: Self-hosting
description: Deploy and operate a private BudgetBuddy instance.
icon: lucide/server-cog
status: active
tags: [user, hosting, deployment]
---

# Self-hosting

BudgetBuddy can be hosted privately with Docker Compose. The current Compose setup provides the authentication service, backend, database, and cache. The web app is deployed separately unless you build and publish it yourself.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- A domain and TLS termination for public deployments
- Persistent storage for the database and application data
- The required environment variables for each service

## Deploy with Docker Compose

1. Obtain the repository and change to its root directory.
2. Configure the environment files required by the services.
3. Start the stack:

   ```bash
   docker compose up -d
   ```

4. Verify that the services are running and inspect their logs if a health check fails:

   ```bash
   docker compose ps
   docker compose logs --tail=100
   ```

The authentication service and backend are available on their configured local ports. Do not expose internal service ports directly to the public internet; use a reverse proxy with TLS.

## Railway

BudgetBuddy is also designed to be deployable on [Railway](https://railway.app/). Service-specific `railway.json` files define build and deployment behavior. Review the provider documentation before changing health checks, start commands, or migration commands.

## Before exposing an instance publicly

- Configure strong, unique secrets.
- Configure TLS and a reverse proxy.
- Use persistent volumes for all required data.
- Test backup and restore before importing real financial data.
- Restrict administrative and database access.
- Record the deployed version and environment configuration securely.

## Updates and recovery

Before an update, create and verify a backup. Apply database migrations using the release instructions for the target version, then verify service health and sign-in. If the update fails, stop exposing the instance, preserve logs, and restore using the tested recovery procedure.

For implementation details, see the [Developer services documentation](../developer/services.md).
