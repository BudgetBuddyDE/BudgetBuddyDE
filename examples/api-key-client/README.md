# API Key Client Example

Minimal Node.js TypeScript example for reading BudgetBuddyDE data with `@budgetbuddyde/api` and a user API key.

## Environment Variables

| Variable                   | Required | Description                                                                                                 |
| -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `BUDGETBUDDY_API_KEY`      | Yes      | User API key created in the BudgetBuddyDE settings. The example sends it as the `x-api-key` header.         |
| `BUDGETBUDDY_BACKEND_URL`  | Yes      | Base URL of the BudgetBuddyDE backend, for example `https://backend.budgetbuddy.de` or a local backend URL. |
| `BUDGETBUDDY_RESULT_LIMIT` | No       | Number of transactions and recurring payments to fetch. Defaults to `5` when unset or invalid.              |

Copy `.env.example` to `.env` as a starting point, or export the variables in your shell. The example loads `.env` via `dotenv`.

## Run

```bash
export BUDGETBUDDY_API_KEY="bb-your-api-key"
export BUDGETBUDDY_BACKEND_URL="https://backend.budgetbuddy.de"

npm run build --workspace=@budgetbuddyde/example-api-key-client
npm run start --workspace=@budgetbuddyde/example-api-key-client
```
