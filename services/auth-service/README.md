# Auth-Service

![CI](https://ci.tklein.it/api/v1/teams/budgetbuddyde/pipelines/auth-service/jobs/build-auth-service/badge)

## Getting started

1. Clone the repository

   ```shell
   git clone git@github.com:budgetbuddyde/budgetbuddyde.git
   cd ./services/auth-service
   ```

2. Set all required environment-variables as defined in the `.env.example`
3. Install all required dependencies

   ```shell
   npm install
   ```

4. Start the application

   ```shell
   npm run watch
   # or run the build using
   npm start
   ```

## Database migration

> [!TIP]
> For more information about the schema generation and migration have a look into [the documentation](https://www.better-auth.com/docs/basic-usage#migrate-database).

The database schema required for the Better-Auth auth service can be generated using the @better-auth/cli:

```bash
npm run ba:schema-generate
```

The previously generated schema can be applied using Drizzle Kit. This can be done with the following commands:

> [!WARNUNG]
> Make sure that the `DATABASE_URL` environment variable is set and points to the target database where the schema should be applied. If the environment variable is not set, the process will fail with an error.

```bash
npm run db:generate # will generate all required schemas
npm run db:migrate
```
