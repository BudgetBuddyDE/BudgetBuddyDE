# Guide: Neuen Service hinzufügen

## 1) Service anlegen

1. Verzeichnis unter `services/<name>/` erstellen
2. Eigenes `package.json` und `tsconfig.json` hinzufügen
3. Laufzeit-Einstiegspunkt definieren (z. B. `src/server.ts`)

## 2) Service als Workspace konfigurieren

- Service bleibt Teil von `services/*` und wird damit automatisch im Workspace erkannt.
- Service sollte `private: true` enthalten.

## 3) Interne Abhängigkeiten korrekt referenzieren

- Interne Pakete immer über `workspace:*` einbinden.
- Keine Registry-Versionen für lokale Monorepo-Abhängigkeiten verwenden.

## 4) Standardskripte ergänzen

- `dev`
- `build`
- `lint` / `lint:check`
- `format` / `format:check`
- `check`
- `test`

## 5) Qualitätssicherung

Vor Merge immer im Root ausführen:

```bash
npm run lint
npm run test
npm run build
```

## 6) CI-Integration

- Der Service wird automatisch von der CI (`.github/workflows/ci.yml`) mitgeprüft.
- Für Deployment-/Release-spezifische Automatisierung einen eigenen Workflow ergänzen.
