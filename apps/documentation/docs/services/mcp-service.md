---
title: MCP Service
icon: lucide/bot
tags:
    - service
    - mcp
    - ai
---

## Overview

The MCP Service exposes the BudgetBuddyDE backend as an AI-callable tool server implementing the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). It is built on Express.js and uses the [Streamable HTTP transport](https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/#streamable-http) so that any MCP-compatible AI client (e.g. Claude Desktop, Cursor, or a custom agent) can interact with BudgetBuddyDE data.

```
npx @budgetbuddyde/mcp-service
```

## Features

- **26 MCP tools** covering full CRUD for categories, payment methods, transactions, recurring payments, and budgets plus read-only access to attachments
- **API-key authentication** against the BudgetBuddyDE backend
- **Optional endpoint protection** via a service-level `MCP_API_KEY`
- **ExpressJS HTTP server** – compatible with any Streamable-HTTP MCP client

## Architecture

### Technologies

- **Framework**: [Express.js](https://github.com/expressjs/express)
- **Language**: [TypeScript](https://github.com/microsoft/TypeScript)
- **MCP SDK**: [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- **Transport**: Streamable HTTP (stateless – one transport per request)

### Structure

```txt
src/
├── __tests__/     # Unit tests for middleware and tool helpers
├── lib/           # API client factory
├── middleware/    # API-key guard, request logger, error handler
├── tools/         # One file per entity – MCP tool registrations
├── config.ts      # Environment-based configuration
└── server.ts      # Express app + MCP endpoint
```

### MCP Endpoint

```
POST   /mcp   — main JSON-RPC endpoint
GET    /mcp   — SSE stream for server-initiated messages
DELETE /mcp   — close session
GET    /health — health check
```

### Authentication Flow

```
AI Client ──x-api-key──▶ MCP Service ──x-api-key (BUDGETBUDDY_API_KEY)──▶ Backend
```

1. The AI client optionally sends `x-api-key: <MCP_API_KEY>` on every request to the MCP service.
2. The MCP service forwards all backend calls using the pre-configured `BUDGETBUDDY_API_KEY`.

## Available Tools

### Categories (`/api/category`)

| Tool | Description |
|:-----|:------------|
| `list_categories` | List all categories (supports `from`, `to`, `search`) |
| `get_category` | Get a category by UUID |
| `create_category` | Create a new category |
| `update_category` | Update an existing category |
| `delete_category` | Delete a category by UUID |

### Payment Methods (`/api/paymentMethod`)

| Tool | Description |
|:-----|:------------|
| `list_payment_methods` | List all payment methods |
| `get_payment_method` | Get a payment method by UUID |
| `create_payment_method` | Create a new payment method |
| `update_payment_method` | Update an existing payment method |
| `delete_payment_method` | Delete a payment method by UUID |

### Transactions (`/api/transaction`)

| Tool | Description |
|:-----|:------------|
| `list_transactions` | List transactions (supports pagination and date filters) |
| `get_transaction` | Get a transaction by UUID |
| `create_transaction` | Create a new transaction |
| `update_transaction` | Update an existing transaction |
| `delete_transaction` | Delete a transaction by UUID |

### Recurring Payments (`/api/recurringPayment`)

| Tool | Description |
|:-----|:------------|
| `list_recurring_payments` | List recurring payments |
| `get_recurring_payment` | Get a recurring payment by UUID |
| `create_recurring_payment` | Create a new recurring payment |
| `update_recurring_payment` | Update an existing recurring payment |
| `delete_recurring_payment` | Delete a recurring payment by UUID |

### Budgets (`/api/budget`)

| Tool | Description |
|:-----|:------------|
| `list_budgets` | List all budgets |
| `get_budget` | Get a budget by UUID |
| `create_budget` | Create a new budget |
| `update_budget` | Update an existing budget |
| `delete_budget` | Delete a budget by UUID |

### Attachments (`/api/attachment`) — read-only

| Tool | Description |
|:-----|:------------|
| `get_attachment` | Get a single attachment with a fresh signed URL |
| `list_transaction_attachments` | List all attachments for a transaction |

## Development

**Start the service locally**

```bash
npm install
cp .env.example .env  # fill in BUDGETBUDDY_BACKEND_URL and BUDGETBUDDY_API_KEY
npm run dev
```

**Run tests**

```bash
npm test
```

**Lint & format**

```bash
npm run check        # check only
npm run check:write  # auto-fix
```

**Build**

```bash
npm run build
npm start
```

### Configuration

#### Environment Variables

| Variable | Required | Description | Default |
|:---------|:--------:|:------------|:--------|
| `BUDGETBUDDY_BACKEND_URL` | ✓ | Base URL of the BudgetBuddyDE backend | – |
| `BUDGETBUDDY_API_KEY` | ✓ | API key for authenticating against the backend | – |
| `MCP_API_KEY` | – | If set, all `/mcp` requests must include this key in `x-api-key` | – |
| `PORT` | – | HTTP port | `7000` |
| `NODE_ENV` | – | Runtime environment | `development` |
| `LOG_LEVEL` | – | Winston log level | `info` |

## Usage

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "budgetbuddyde": {
      "url": "http://localhost:7000/mcp",
      "headers": {
        "x-api-key": "<MCP_API_KEY>"
      }
    }
  }
}
```

### npx

```bash
BUDGETBUDDY_BACKEND_URL=https://api.budget-buddy.de \
BUDGETBUDDY_API_KEY=bb-your-key \
npx @budgetbuddyde/mcp-service
```

## Deployment

### Docker

```bash
docker build -t budgetbuddyde/mcp-service .
docker run -d -p 7000:7000 \
  -e BUDGETBUDDY_BACKEND_URL=https://api.budget-buddy.de \
  -e BUDGETBUDDY_API_KEY=bb-your-key \
  -e MCP_API_KEY=your-mcp-secret \
  budgetbuddyde/mcp-service
```

## Dependencies

The MCP Service uses the following internal packages:

- [`@budgetbuddyde/api`](../packages/api.md) — typed backend API client
- [`@budgetbuddyde/logger`](../packages/logger.md) — shared Winston logger helpers
- [`@budgetbuddyde/utils`](../packages/utils.md) — shared runtime/port utilities

and requires:

- A running [Backend](./backend.md) instance
