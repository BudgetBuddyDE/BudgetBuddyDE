# Getting Started

Welcome to your new project.

It contains these folders and files, following our recommended project layout:

| File or Folder | Purpose                              |
| -------------- | ------------------------------------ |
| `app/`         | content for UI frontends goes here   |
| `db/`          | your domain models and data go here  |
| `srv/`         | your service models and code go here |
| `package.json` | project metadata and configuration   |
| `readme.md`    | this getting started guide           |

## Next Steps

- Open a new terminal and run `cds watch`
- (in VS Code simply choose _**Terminal** > Run Task > cds watch_)
- Start adding content, for example, a [db/schema.cds](db/schema.cds).

## Learn More

Learn more at https://cap.cloud.sap/docs/get-started/.

## Deploy to SQLite (locally)

1. Deploy current schema

   ```bash
   # will deploy only the database schema without any data
   cds deploy --model-only --profile development
   ```

2. Deploy data

   ```bash
   # will "upload" all local data from "db/data" and "test/data"
   cds deploy --profile development
   ```

# Deployment

## Service

Der Service wird als einfaches NodeJS-Backend mithilfe eines Docker Images deployed.

### Tests

Die Tests können mithilfe der Anweisung `npm run test` ausgeführt werden und können dazu genutzt werden um die Logik des OData-Services zu validieren. Zusätzlich wird die Integration zwischen Auth-Service und OData-Service getestet um die Funktionalität zu validieren.

## Database

Um die Daten zu persistieren wird auf eine PostgreSQL Datenbank zurückgegriffen, welche an den OData-Service angebunden wird. Die Verkünpfung erfolgt mithilfe von Umgebungsvariablen wie in der [`.env.example`](./.env.example) definiert.

### Schema

Das aktuelle Datenbankschema sowie dazugehörige Datenbankviews können mithilfe von `cds deploy --model-only` generiert werden.
Mit einem konfigurierten Profil, kann das Schema direkt auf ein Ziel angewandt werden.

### Default data
