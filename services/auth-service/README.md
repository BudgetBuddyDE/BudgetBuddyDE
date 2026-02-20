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

> [!IMPORTANT]
> The database schema is provided and handled by the @budgetbuddyde/db package. This package is a shared library that is used across all services to ensure a consistent database schema and to avoid code duplication. The schema is defined using Drizzle ORM and can be generated and applied using the @better-auth/cli and Drizzle Kit.
