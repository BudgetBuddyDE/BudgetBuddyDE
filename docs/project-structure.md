# Projektstruktur

## Top-Level-Struktur

- `apps/` – Frontend-Anwendungen
- `services/` – Laufzeit-Services (Backend, Auth)
- `packages/` – Geteilte Bibliotheken
- `.github/workflows/` – GitHub Actions (CI + Publishing)
- `docs/` – Projekt- und Setup-Dokumentation

## Workspaces

Der Workspace ist im Root-`package.json` definiert:

- `packages/*`
- `services/*`
- `apps/webapp`

## Publishing-Strategie

Folgende Pakete bleiben für externe Entwickler veröffentlichbar:

- `@budgetbuddyde/api`
- `@budgetbuddyde/db`
- `@budgetbuddyde/types`

Alle anderen internen Pakete/Services sind für lokales Workspace-Usage gedacht.

## Turborepo-Strategie

- `build` hängt auf `^build`, damit Abhängigkeiten zuerst gebaut werden.
- `test` hängt auf `^build` und `^test`, damit Consumer immer lokale, aktuelle Builds verwenden.
- `lint`/`check` laufen entlang der Workspace-Abhängigkeitskette.
- Interne Consumer verwenden lokale `file:`-Abhängigkeiten statt Registry-Versionen.
