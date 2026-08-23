---
title: MCP Integration
description: Connect BudgetBuddy through the Model Context Protocol.
icon: lucide/bot
---

The MCP service under `services/mcp` provides BudgetBuddy features as MCP tools for compatible AI clients. It uses the typed API client and communicates with the backend.

## Configuration

```text
BUDGETBUDDY_BACKEND_URL=http://localhost:9000
```

Start the service with `npm run dev --workspace @budgetbuddyde/mcp`. For production integrations, explicitly configure authentication, network access, and permissions.

## Security Boundaries

- Share financial data only with trusted MCP clients.
- Do not commit API keys in client configurations.
- Run write tools with minimal permissions.
- Monitor tool calls and errors.
