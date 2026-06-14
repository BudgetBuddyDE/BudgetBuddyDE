# Guide: Neues Package hinzufügen

## 1) Package anlegen

1. Verzeichnis unter `packages/<name>/` erstellen
2. `package.json` mit eindeutigem Scope-Namen anlegen (`@budgetbuddyde/<name>`)
3. `tsconfig.json` und `src/index.ts` ergänzen

## 2) Scripts vereinheitlichen

Das neue Package sollte dieselben Kern-Scripts unterstützen:

- `build`
- `lint` / `lint:check`
- `format` / `format:check`
- `check`
- `test`

## 3) Lokale Nutzung einbinden

- In konsumierenden Workspaces die Dependency als `workspace:*` eintragen.
- Danach `npm install` oder `npm ci` im Root ausführen.

## 4) Turbo-Integration prüfen

- Sicherstellen, dass `build`-Artefakte in ein bekanntes Output-Verzeichnis geschrieben werden (`lib/**` oder `build/**`).
- Paket über Root-Kommandos validieren:

  ```bash
  npm run lint
  npm run test
  npm run build
  ```

## 5) Optionales Publishing

- Nur wenn das Package extern benötigt wird:
  - `private` entfernen bzw. auf `false`
  - `publishConfig` ergänzen
  - Publish über den Workflow `Publish NPM Package` durchführen
