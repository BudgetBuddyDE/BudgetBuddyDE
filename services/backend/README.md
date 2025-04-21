# Backend

## Introduction

## Features

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

### CI/CD
