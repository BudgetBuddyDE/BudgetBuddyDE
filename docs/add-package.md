# Guide: Add a new package

## 1. Create the package

Create a new directory under `packages/<name>`.

```text
packages/<name>/
  package.json
  tsconfig.json
  src/index.ts
```

## 2. Configure `package.json`

Internal packages are private by default:

```json
{
  "name": "@budgetbuddyde/<name>",
  "version": "0.1.0",
  "private": true,
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "scripts": {
    "build": "rimraf lib && tsc",
    "typecheck": "tsc --noEmit",
    "lint:check": "eslint \"src/**/*.{js,jsx,ts,tsx}\" --max-warnings=0",
    "format:check": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "test": "vitest run --silent"
  }
}
```

Only remove `private` and add `publishConfig` if the package should be published externally. Currently this only applies to `@budgetbuddyde/api`, `@budgetbuddyde/db`, and `@budgetbuddyde/types`.

## 3. Use the package

Add the package to the consumer with the exact local version:

```json
{
  "dependencies": {
    "@budgetbuddyde/<name>": "0.1.0"
  }
}
```

Then update the root lockfile:

```bash
npm install --package-lock-only --ignore-scripts
```

## 4. Validate

```bash
npm run build -- --filter=@budgetbuddyde/<name>
npm run build
```
