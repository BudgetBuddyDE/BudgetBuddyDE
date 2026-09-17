---
title: API keys and MCP
description: Connect scripts and AI assistants to your BudgetBuddy data.
icon: KeyRound
---

API keys give external clients access to your account without sharing your password. They are managed under **Settings → API keys** and can be used with the REST API and with the MCP service, for example to connect an AI assistant.

## Create an API key

1. Open **Settings → API keys** and create a new key.
2. Give it a name — names are required and help you recognize what the key is used for.
3. Copy the key immediately: it is shown only once. Keys start with the prefix `bb-`.

## Security

- Treat an API key like a password. Store it in a secret manager or environment variable, never in source code.
- Keys currently act with full access to your account; fine-grained per-key permissions are not available yet.
- API keys are rate limited by the server and additionally subject to the instance's general rate limits in production.
- Delete keys you no longer need immediately.

## Use with the REST API

Send the key in the `x-api-key` header:

```bash
curl -H "x-api-key: bb-your-api-key" \
  "https://your-backend.example.com/api/transaction?from=0&to=5"
```

A runnable example is included in the repository: [`examples/api-key-client`](https://github.com/BudgetBuddyDE/BudgetBuddyDE/tree/main/examples/api-key-client). It reads `BUDGETBUDDY_API_KEY` and `BUDGETBUDDY_BACKEND_URL` from a `.env` file and prints recent transactions and recurring payments.

## Use with MCP

The MCP service exposes BudgetBuddy as tools for LLM clients at the endpoint `/mcp` (default `http://localhost:8070/mcp` on a self-hosted instance). Authenticate with either header:

- `x-api-key: bb-your-api-key`, or
- `Authorization: Bearer bb-your-api-key`

Example configuration for an MCP client that supports command-based servers:

```json
{
  "mcpServers": {
    "budgetbuddy": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://your-mcp.example.com/mcp", "--header", "x-api-key:${BUDGETBUDDY_API_KEY}"],
      "env": {
        "BUDGETBUDDY_API_KEY": "bb-your-api-key"
      }
    }
  }
}
```

Available tools cover categories, payment methods, transactions, recurring payments, budgets, and attachments. In production the MCP service rate limits requests to 120 per minute.

## Related pages

- [Account](/users/account)
- [Self-hosting: configuration](/self-hosting/configuration)
- [Developers: API and MCP](/developers/api-and-mcp)
