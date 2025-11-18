# Backend

## Getting started

### Environment Variables

#### `DATABASE_URL`

The connection string for the PostgreSQL database.

## Deployment

### Service

### Database

> [!TIP]
> Das Backend verwendet Drizzle ORM für die Datenbankmigrationen. In [der Dokumentation](https://orm.drizzle.team/docs/kit-overview) von Drizzle ORM können weitere Informationen zum Thema Schema-Migration gefunden werden.

1. Generate migration SQL files using Drizzle ORM.

   ```bash
   npm run db:generate
   ```

2. Apply the generated migration files to your PostgreSQL database.

   ```bash
   npm run db:migrate
   ```

Now your database schema should be up-to-date with the application's requirements.

## Credits

- ExpressJS
- Drizzle ORM
