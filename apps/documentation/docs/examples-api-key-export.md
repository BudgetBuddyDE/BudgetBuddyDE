# API-Key Datenexport Example

Das Example `@budgetbuddyde/example-export-data-with-api-key` zeigt, wie Daten aus dem BudgetBuddyDE Backend mit einem persönlichen API-Key exportiert werden können. Die CLI ist in TypeScript geschrieben und verwendet den lokalen API-Client `@budgetbuddyde/api` sowie die CSV-Utility `toCSV` aus `@budgetbuddyde/utils`.

## Voraussetzungen

Lege einen API-Key in BudgetBuddyDE an und stelle die Backend-URL bereit:

```bash
export BUDGETBUDDY_API_KEY="bb-your-api-key"
export BUDGETBUDDY_BACKEND_URL="https://backend.budgetbuddy.de"
```

Optional begrenzt `BUDGETBUDDY_RESULT_LIMIT` die Anzahl der Datensätze pro Entität. Ohne Wert werden bis zu `100` Datensätze exportiert.

## Build

```bash
npm run build --workspace=@budgetbuddyde/api
npm run build --workspace=@budgetbuddyde/utils
npm run build --workspace=@budgetbuddyde/logger
npm run build --workspace=@budgetbuddyde/example-export-data-with-api-key
```

## Alle Daten exportieren

Ohne `--entity` exportiert die CLI alle unterstützten Entitäten. Als Formate stehen `json` und `csv` zur Verfügung:

```bash
npm run start --workspace=@budgetbuddyde/example-export-data-with-api-key -- --format json
npm run start --workspace=@budgetbuddyde/example-export-data-with-api-key -- --format csv
```

## Einzelne Entität exportieren

Mit `--entity` wird nur eine Entität exportiert:

```bash
npm run start --workspace=@budgetbuddyde/example-export-data-with-api-key -- --entity transactions --format json
npm run start --workspace=@budgetbuddyde/example-export-data-with-api-key -- --entity categories --format csv
```

Unterstützte Entitäten sind:

- `transactions`
- `recurringPayments`
- `categories`
- `paymentMethods`
- `budgets`

## Einzelnen Datensatz exportieren

Für einen einzelnen Datensatz wird zusätzlich `--id` übergeben:

```bash
npm run start --workspace=@budgetbuddyde/example-export-data-with-api-key -- --entity categories --id <category-id> --format json
```

`--id` kann nicht mit `--entity all` kombiniert werden, weil der Datensatz eindeutig zu einer Entität gehören muss. Mit `--verbose` oder `-v` wird das Log-Level von `info` auf `debug` erhöht. Logs werden auf stderr geschrieben, damit die exportierten Daten auf stdout bleiben.

## Authentifikation

Die CLI sendet den API-Key bei jedem Request als HTTP-Header `x-api-key`. Zusätzlich wird `Accept: application/json` gesetzt.
