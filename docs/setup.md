# Initialer Setup-Guide

BudgetBuddyDE ist ein npm-basiertes Monorepo. Alle Apps, Services und Packages werden über npm Workspaces aus dem Repository verlinkt. Lokale Builds verwenden dadurch immer die lokale Package-Version und benötigen keinen vorherigen Publish zu npm.

## Voraussetzungen

- Node.js 22 oder neuer
- npm 11.x passend zur Angabe in `package.json`
- Zugriff auf benötigte `.env` Dateien für Webapp und Services

## Installation

```bash
npm install
```

Die Installation muss im Repository-Root ausgeführt werden. npm legt dabei Symlinks für alle Workspaces in `node_modules/@budgetbuddyde/*` an.

## Wichtige Befehle

```bash
npm run dev              # startet alle dev Tasks über Turborepo
npm run dev-services     # startet nur Services
npm run format:check     # prüft Formatierung
npm run lint:check       # prüft Linting ohne Auto-Fix
npm run typecheck        # führt TypeScript-Prüfungen aus
npm test                 # führt Tests aus
npm run build            # baut alle Packages, Services und Apps in dependency order
npm run build-packages   # baut nur packages/*
npm run build-services   # baut nur services/*
npm run build-apps       # baut nur apps/*
```

## Lokale Package-Auflösung

Interne Dependencies werden mit den lokalen Package-Versionen eingetragen. Solange der Workspace-Name und die Version zur Dependency passen, verlinkt npm das lokale Package anstatt es aus der Registry zu installieren. Das ist wichtig, weil npm in dieser Umgebung kein `workspace:*` Protokoll akzeptiert.

Wenn du die Version eines internen Packages änderst, aktualisiere auch alle internen Consumers und führe danach aus:

```bash
npm install --package-lock-only --ignore-scripts
```

## CI lokal nachstellen

```bash
npm ci
npm run format:check
npm run lint:check
npm run typecheck
npm test
npm run build
```
