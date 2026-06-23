# API Key Fetch Example

Small TypeScript demo that fetches data from BudgetBuddyDE with `@budgetbuddyde/api` and an API key configured once through the SDK request config.

## Run

```bash
BUDGETBUDDY_API_KEY=bb-... npm run demo --workspace=@budgetbuddyde/example-api-key-fetch
```

The backend URL defaults to `http://localhost:9000`. Override it with:

```bash
BUDGETBUDDY_BACKEND_URL=https://backend.example.com BUDGETBUDDY_API_KEY=bb-... npm run demo --workspace=@budgetbuddyde/example-api-key-fetch
```
