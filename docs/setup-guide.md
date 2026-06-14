# Initial Setup Guide

## Voraussetzungen

- Node.js 22.x
- npm 11.x

## Erstes Setup

1. Repository klonen
2. Abhängigkeiten installieren:

   ```bash
   npm ci
   ```

3. Lokale Qualitätssicherung ausführen:

   ```bash
   npm run lint
   npm run test
   npm run build
   ```

## Lokales Workspace-Verhalten

- Interne Abhängigkeiten werden über lokale `file:`-Verweise innerhalb des Workspaces aufgelöst.
- Die Services und Apps verwenden dadurch immer die lokalen Workspace-Pakete.
- Für Tests und Builds werden abhängige Pakete über Turborepo zuerst lokal gebaut.

## Wichtige Kommandos

- Entwicklung: `npm run dev`
- Nur Pakete bauen: `npm run build-packages`
- Nur Services starten: `npm run dev-services`
- Gesamte Prüfung: `npm run check`
