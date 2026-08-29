---
title: Authentication and API Keys
description: Access the auth service, backend, and MCP service.
icon: lucide/key-round
---

## Browser

Browser requests use session credentials. The webapp gets the hosts of the auth service and backend through public environment variables.

### Auth Data Export

`GET /api/export?format=json|csv` on the auth service creates a ZIP archive for the current session user. It contains separate
files for the user profile, session metadata, linked accounts, API-key metadata, and a `manifest.json`.

The export deliberately excludes session tokens, OAuth access, refresh and ID tokens, password data, verification secrets,
and API-key values or hashes. The response uses `Cache-Control: no-store` and must be handled as sensitive personal data.

## API Key Clients

Non-interactive clients can use API keys. A key must be kept only in secure secret stores and should be restricted to the least access required.

Example code is available under `examples/api-key-client`. Configure its `.env.example` and review the current client implementation before use.

## MCP

The MCP service forwards authenticated actions to the backend. Use a dedicated backend URL and separate credentials for MCP integrations.
