# Guide: Neuen Service hinzufügen

## 1. Service anlegen

Lege den Service unter `services/<name>` an.

```text
services/<name>/
  package.json
  tsconfig.json
  src/server.ts
```

## 2. Workspace Package konfigurieren

Der Package-Name soll dem Workspace-Schema folgen:

```json
{
  "name": "@budgetbuddyde/<name>",
  "version": "0.1.0",
  "private": true,
  "main": "build/src/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node build/src/server.js",
    "build": "rimraf build && tsc",
    "typecheck": "tsc --noEmit",
    "lint:check": "eslint \"src/**/*.{js,jsx,ts,tsx}\" --max-warnings=0",
    "format:check": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "test": "vitest run"
  }
}
```

## 3. Interne Packages einbinden

Verwende lokale Workspaces als normale Dependencies mit passender lokaler Version:

```json
{
  "dependencies": {
    "@budgetbuddyde/types": "1.1.1"
  }
}
```

npm verlinkt das lokale Package aus `packages/types`, wenn Name und Version passen.

## 4. Turborepo nutzen

Es ist keine eigene `turbo.json` im Service nötig. Die Root-Konfiguration erkennt `build/**` als Output für Services.

Nützliche Befehle:

```bash
npm run dev -- --filter=@budgetbuddyde/<name>
npm run build -- --filter=@budgetbuddyde/<name>
npm test -- --filter=@budgetbuddyde/<name>
```
