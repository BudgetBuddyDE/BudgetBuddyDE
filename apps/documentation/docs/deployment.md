---
title: Deployment
icon: lucide/server-cog
tags: [deployment, ci/cd]
---

## Self-Hosted (Docker Compose)

You can easily host the backend services ([auth-services](./services/auth-service.md#overview){data-preview}, [backend](./services/backend.md#overview){data-preview}, database and cache) yourself using `docker-compose`.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Configuration

Use the `docker-compose.yml` from the repository.

### Running the Stack

1. Start the services:
   ```bash
   # Start services in detached mode
   docker-compose up -d
   ```

2. The services (and databases) will be available at:
    - **Auth Service**: `http://localhost:8080`
    - **Backend**: `http://localhost:9000`

!!! warning
    The Webapp is currently not included in this Docker Compose setup. You can deploy it separately (e.g., on Vercel) or build a Docker image for it manually.

## Railway

BudgetBuddyDE is designed to be easily deployable on [Railway](https://railway.app/).

[![Railway Logo](https://railway.com/button.svg)](https://railway.com/deploy/WjE5vD?referralCode=SD-6Xm&utm_medium=integration&utm_source=template&utm_campaign=generic)

### Instance configuration

It is possible to configure the runtime of a service in the Railway cloud using `railway.json` files. These are located in the directory of a service or an app.
The Railway documentation offers some help regarding the possible configuration options...

- [Railway Docs: Using Config as Code](https://docs.railway.com/guides/config-as-code)
- [Railway Docs: Using Config as Code -> Configurable settings](https://docs.railway.com/reference/config-as-code#configurable-settings)

```json title="railway.json"
{
   "$schema": "https://railway.com/railway.schema.json",
   "build": {
      "builder": "NIXPACKS",
      "buildCommand": "echo building!"
   },
   "deploy": {
      "preDeployCommand": ["npm run db:migrate"],
      "startCommand": "echo starting!",
      "healthcheckPath": "/",
      "healthcheckTimeout": 100,
      "restartPolicyType": "never"
   }
}
```
