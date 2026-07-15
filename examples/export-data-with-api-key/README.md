# API Key Client Example

Node.js TypeScript CLI example for exporting BudgetBuddyDE data with `@budgetbuddyde/api`, `@budgetbuddyde/utils` and a user API key.

## Environment Variables

| Variable                   | Required | Description                                                                                                 |
| -------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `BUDGETBUDDY_API_KEY`      | Yes      | User API key created in the BudgetBuddyDE settings. The example sends it as the `x-api-key` header.         |
| `BUDGETBUDDY_BACKEND_URL`  | Yes      | Base URL of the BudgetBuddyDE backend, for example `https://backend.budgetbuddy.de` or a local backend URL. |
| `BUDGETBUDDY_RESULT_LIMIT` | No       | Number of records to fetch per entity for collection exports. Defaults to `100` when unset or invalid.      |

Copy `.env.example` to `.env` as a starting point, or export the variables in your shell. The example loads `.env` via `dotenv`.

## Build

```bash
npm run build --workspace=@budgetbuddyde/api
npm run build --workspace=@budgetbuddyde/utils
npm run build --workspace=@budgetbuddyde/logger
npm run build --workspace=@budgetbuddyde/example-export-data-with-api-key
```

## Export all entities

```bash
npm run start --workspace=@budgetbuddyde/example-export-data-with-api-key -- --format json
npm run start --workspace=@budgetbuddyde/example-export-data-with-api-key -- --format csv
```

## Export one entity

```bash
npm run start --workspace=@budgetbuddyde/example-export-data-with-api-key -- --entity transactions --format json
npm run start --workspace=@budgetbuddyde/example-export-data-with-api-key -- --entity categories --format csv
```

Supported entities are `transactions`, `recurringPayments`, `categories`, `paymentMethods` and `budgets`.

## Export one record

```bash
npm run start --workspace=@budgetbuddyde/example-export-data-with-api-key -- --entity categories --id <category-id> --format json
```

`--id` can only be used together with a single `--entity`. Use `--verbose` or `-v` to raise the CLI log level from `info` to `debug`. Logs are written to stderr so exported data stays on stdout.
