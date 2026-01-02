# Backend

## Getting started

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a `.env` file in the root of the `new-backend` service by copying the provided `.env.example` file and adjusting the values as needed.

   ```bash
   cp .env.example .env
   ```

3. Start the development server

   ```bash
   npm run dev
   ```

4. Build the project

   ```bash
   npm run build
   ```

5. Start the production server

   ```bash
   npm start
   ```

## Testing

The backend service includes comprehensive unit and integration tests to ensure code quality and validate business logic. For detailed information about the testing infrastructure, running tests, and writing new tests, see [TEST.md](./TEST.md).

### Quick Start

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- src/__tests__/integration/category.test.ts
```

For more information, including prerequisites and troubleshooting, see the [Testing Documentation](./TEST.md).

### Environment Variables

#### `NODE_ENV`

The `NODE_ENV` environment variable defines the execution environment of the backend. Possible values are `development`, `production`, and `test`. By default, the value is set to `development`. To ensure correct behavior in production environments, this variable should be set to `production`.

#### `DATABASE_URL`

The connection string for the PostgreSQL database.

#### `REDIS_URL`

The connection string for the Redis cache.

##### `REDIS_DB`

The index of the Redis database to use. If not set, it defaults to `1`.

#### `AUTH_SERVICE_HOST`

The base URL of the authentication service. If not set, it defaults to `http://localhost:8080`.

#### `TRUSTED_ORIGINS`

A comma-separated list of trusted origins that are allowed to make CORS requests to the backend.

#### `PORT`

The `PORT` environment variable defines the port on which the backend server listens. If the variable is not explicitly set, port `9000` is used by default.

#### `LOG_LEVEL`

The `LOG_LEVEL` environment variable determines the level of detail for logging in the backend. Possible values are: `DEBUG`, `INFO`, `WARN`, `ERROR`, and `FATAL`. By default, the value is set to `INFO`.

#### `TIMEZONE`

The `TIMEZONE` environment variable defines the time zone used for time-related operations in the backend (e.g., for scheduling jobs). By default, the time zone is set to `Europe/Berlin`.

## Deployment

### Service

### Database

> [!TIP]
> The backend uses Drizzle ORM for database migrations. More information on schema migration can be found in [the documentation](https://orm.drizzle.team/docs/kit-overview) of Drizzle ORM.

1. Generate migration SQL files using Drizzle ORM.

   ```bash
   npm run db:generate
   ```

2. Apply the generated migration files to your PostgreSQL database.

   ```bash
   npm run db:migrate
   ```

Now your database schema should be up-to-date with the application's requirements.

## Jobs

### `process-recurring-payments`

This job processes all due recurring payments and creates corresponding transactions. It is scheduled to run daily at 01:30 AM in the configured timezone.

> [!IMPORTANT]
> All recurring payments due on today's date will be processed. Payments that fall on days that do not exist in a month (e.g., February 31) will be processed on the last day of the current month.

## Credits

- [ExpressJS](https://expressjs.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
