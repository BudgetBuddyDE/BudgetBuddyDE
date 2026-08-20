# oclif-example-cli

Ein vollständiges Beispiel für eine TypeScript-CLI mit [oclif](https://oclif.io/).

Bei normalen Aufrufen wird vor dem Befehl ein farbiger ANSI-Shadow-Banner angezeigt. Die Ausgabe mit `--json` bleibt absichtlich bannerfrei, damit sie direkt weiterverarbeitet werden kann.

## Voraussetzungen

- Node.js 18 oder neuer
- npm

## Entwicklung

```bash
npm install
npm run dev -- hello Ada
npm test
npm run pack:dry-run
```

Die produktiv gebaute CLI kann mit `npm run build` und anschließend `node bin/run.js hello` ausgeführt werden.

## Befehle

```text
oclif-example hello [NAME]                 Begrüßung ausgeben
oclif-example hello Ada --uppercase       Großschreibung verwenden
oclif-example hello Ada --json             JSON ausgeben
oclif-example config                       Gespeicherte Begrüßung lesen
oclif-example config "Guten Morgen"        Begrüßung speichern
oclif-example config --clear               Konfiguration löschen
```

Die Konfiguration wird als `.oclif-example.json` im Home-Verzeichnis gespeichert. `oclif-example --help` zeigt die automatisch erzeugte Hilfe.

## Veröffentlichung

Der Workflow in `.github/workflows/ci.yml` läuft bei Pushes und Pull Requests, führt Tests und Build aus und prüft das npm-Paket mit `npm publish --dry-run`. Ein Publish erfolgt nur bei einem GitHub-Release. Dafür muss das Repository-Secret `NPM_TOKEN` gesetzt sein.
