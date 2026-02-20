# `@budgetbuddyde/backend`

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

### Database

> [!IMPORTANT]
> The database schema is provided by the `@budgetbuddyde/db` package. For information on migrations and the initial database setup, see the package documentation.

## Jobs

### `process-recurring-payments`

This job processes all due recurring payments and creates corresponding transactions. It is scheduled to run daily at 01:30 AM in the configured timezone.

> [!IMPORTANT]
> All recurring payments due on today's date will be processed. Payments that fall on days that do not exist in a month (e.g., February 31) will be processed on the last day of the current month.

## Credits

- [ExpressJS](https://expressjs.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
