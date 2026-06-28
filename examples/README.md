# Examples

This directory contains small, runnable examples for using BudgetBuddyDE packages in user-owned integrations.

## API Key Client

`api-key-client` is a minimal Node.js TypeScript project that uses `@budgetbuddyde/api` with a user API key. It reads a few transactions and recurring payments from the backend and prints a compact summary to the console.

### Run

```bash
export BUDGETBUDDY_API_KEY="bb-your-api-key"
export BUDGETBUDDY_BACKEND_URL="https://backend.budgetbuddy.de"

npm run build --workspace=@budgetbuddyde/example-api-key-client
npm run start --workspace=@budgetbuddyde/example-api-key-client
```

### Environment Variables

| Variable                   | Required | Description                                                                                    |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `BUDGETBUDDY_API_KEY`      | Yes      | User API key created in the BudgetBuddyDE settings.                                            |
| `BUDGETBUDDY_BACKEND_URL`  | Yes      | Base URL of the BudgetBuddyDE backend. There is no default value.                              |
| `BUDGETBUDDY_RESULT_LIMIT` | No       | Number of transactions and recurring payments to fetch. Defaults to `5` when unset or invalid. |

### What It Demonstrates

- Passing the API key via the `x-api-key` header.
- Calling `api.backend.transaction.getAll()`.
- Calling `api.backend.recurringPayment.getAll()`.
- Handling the API package's `[data, error]` result tuples.

The example is part of the local npm workspace and Turborepo setup, so formatting, linting, typechecking, tests, and builds are covered by CI.
