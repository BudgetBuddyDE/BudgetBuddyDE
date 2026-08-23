---
title: Authentication and API Keys
description: Access the auth service, backend, and MCP service.
icon: lucide/key-round
---

## Browser

Browser requests use session credentials. The webapp gets the hosts of the auth service and backend through public environment variables.

## API Key Clients

Non-interactive clients can use API keys. A key must be kept only in secure secret stores and should be restricted to the least access required.

Example code is available under `examples/api-key-client`. Configure its `.env.example` and review the current client implementation before use.

## MCP

The MCP service forwards authenticated actions to the backend. Use a dedicated backend URL and separate credentials for MCP integrations.
