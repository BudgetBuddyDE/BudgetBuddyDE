# Backend

## Introduction

## Features

- Authentifizierung mithilfe von Better-Auth

## Getting started

1. Repository klonen
2. Dependencies installieren
3. Umgebungsvariablen setzen
4. Datenbank aufsetzen
   1. PostgreSQL Datenbank hosten
   2. Umgebungsvariable `DATABASE_URL` setzen
   3. Better Auth schema generieren (falls noch nicht geschehen)
      ```bash
      npm run generate-auth-schema
      ```
   4. Datenbank schema generieren
      ```bash
      npm run db-generate
      ```
   5. Schema Migration anwenden
      ```bash
      npm run db-migrate
      ```
5. Service starten
   ```bash
   npm run dev
   ```

> [!INFO]
> Informationen wie der Service gebaut werden kann, können der Seite unter [Building](#building) entnommen werden.

## Building

## Tests

### CRUD Operations

### Stock Management

## Better Auth

> [!TIP]
> Das Backend löst die Implementierung mithilfe von [Better Auth](https://www.better-auth.com/).

> [!TIP]
> Better Auth hat einen Guide welcher einem eine [Anleitung](https://www.better-auth.com/docs/installation) für das initiale Setup des Auth-Services gibt.

## Database

> [!TIP]
> In [der Dokumentation](https://orm.drizzle.team/docs/get-started) gibt es [eine Auflistung](https://orm.drizzle.team/docs/kit-overview) aller Befehle mitsamt einer kurzen Erklärung deren Funktionalität.

### Schema

Das aktuelle Datenbankschema liegt unter `src/db/schema`.

### Setup

### Schema migration

Mithilfe von DrizzleORM können Änderungen am Datenbankschema leicht angewandt werden.
Vorausgesetzt die Änderungen am Datenbankschema wurden bereits durchgeführt, reicht es dieser Anleitung zu folgen.

1. Wechsel das Verzeichnis
   ```bash
   cd services/backend
   ```
2. Setze die Umgebungsvariable `DATABASE_URL` und setze dort die PostgreSQL Verbindungs URL um eine Verbindung zur Datenbank aufbauen zu können
3. Erstelle die benötigten Dateien für die Migration

   ```bash
   npm run db-generate
   ```

4. Wende die Migrationsanweisungen an

   ```bash
   npm run db-migrate
   ```

Sollten die Änderungen am Schema sowie die Verbindungsurl gültig sein, sollten nun die gewünschten Änderungen auf die Datenbank angewandt worden sein.

### CI/CD
