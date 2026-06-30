# @budgetbuddyde/mcp-service

MCP (Model Context Protocol) service for BudgetBuddyDE. Exposes entity CRUD and attachment retrieval as AI-callable tools over a Streamable-HTTP endpoint served by Express.

## Quick Start

```bash
# Install and run directly via npx
npx @budgetbuddyde/mcp-service

# Or build and start locally
npm install
cp .env.example .env  # fill in your values
npm run dev
```

## Environment Variables

| Variable                | Required | Description                                              | Default       |
|:------------------------|:--------:|:---------------------------------------------------------|:--------------|
| `BUDGETBUDDY_BACKEND_URL` | ✓       | Base URL of the BudgetBuddyDE backend service            | –             |
| `BUDGETBUDDY_API_KEY`   | ✓        | API key used to authenticate against the backend         | –             |
| `MCP_API_KEY`           | –        | If set, every request to `/mcp` must carry this key in `x-api-key` | – |
| `PORT`                  | –        | HTTP port the service listens on                         | `7000`        |
| `NODE_ENV`              | –        | Runtime environment                                      | `development` |
| `LOG_LEVEL`             | –        | Winston log level                                        | `info`        |

## MCP Endpoint

The service exposes a single MCP-over-HTTP endpoint:

```
POST /mcp
GET  /mcp   (SSE stream for server-initiated messages)
DELETE /mcp (close session)
```

### Claude Desktop Configuration

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

## Available Tools

| Tool | Description |
|:-----|:------------|
| `list_categories` | List all categories |
| `get_category` | Get a category by ID |
| `create_category` | Create a new category |
| `update_category` | Update a category |
| `delete_category` | Delete a category |
| `list_payment_methods` | List all payment methods |
| `get_payment_method` | Get a payment method by ID |
| `create_payment_method` | Create a new payment method |
| `update_payment_method` | Update a payment method |
| `delete_payment_method` | Delete a payment method |
| `list_transactions` | List transactions (paginated) |
| `get_transaction` | Get a transaction by ID |
| `create_transaction` | Create a new transaction |
| `update_transaction` | Update a transaction |
| `delete_transaction` | Delete a transaction |
| `list_recurring_payments` | List recurring payments |
| `get_recurring_payment` | Get a recurring payment by ID |
| `create_recurring_payment` | Create a new recurring payment |
| `update_recurring_payment` | Update a recurring payment |
| `delete_recurring_payment` | Delete a recurring payment |
| `list_budgets` | List all budgets |
| `get_budget` | Get a budget by ID |
| `create_budget` | Create a new budget |
| `update_budget` | Update a budget |
| `delete_budget` | Delete a budget |
| `get_attachment` | Get a single attachment with signed URL |
| `list_transaction_attachments` | List attachments for a transaction |

## Development

```bash
npm run dev        # start with hot-reload
npm run build      # compile TypeScript
npm test           # run unit tests
npm run check      # lint + format check
npm run check:write # auto-fix lint + format
```
