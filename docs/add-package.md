# Guide: Neues Package hinzufügen

## 1. Package anlegen

Lege ein neues Verzeichnis unter `packages/<name>` an.

```text
packages/<name>/
  package.json
  tsconfig.json
  src/index.ts
```

## 2. `package.json` konfigurieren

Interne Packages sind standardmäßig privat:

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

Nur wenn das Package extern veröffentlicht werden soll, darf `private` entfernt und `publishConfig` ergänzt werden. Aktuell gilt das nur für `@budgetbuddyde/api`, `@budgetbuddyde/db` und `@budgetbuddyde/types`.

## 3. Package verwenden

Füge das Package im Consumer mit exakt der lokalen Version ein:

```json
{
  "dependencies": {
    "@budgetbuddyde/<name>": "0.1.0"
  }
}
```

Danach den Root-Lockfile aktualisieren:

```bash
npm install --package-lock-only --ignore-scripts
```

## 4. Validieren

```bash
npm run build -- --filter=@budgetbuddyde/<name>
npm run build
```
