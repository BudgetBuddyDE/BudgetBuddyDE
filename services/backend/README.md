# Backend

![CI](https://ci.tklein.it/api/v1/teams/budgetbuddyde/pipelines/backend/jobs/build-backend/badge)

## Deployment

> [!IMPORTANT]
> The service is deployed using a Docker image. To establish the database connection within the Docker container, the `.cdsrc` must be generated during the build process and filled with the connection information for the Postres instance.
> Learn more at [SAP Capire Postgres Deployment](https://cap.cloud.sap/docs/guides/databases-postgres#deployment)

### Environment Variables

#### Database Configuration

> [!NOTE]
> These environment variables are only required to be set during the build-process as these will be used to generate the `.cdsrc`-file for the instance.

- `DB_HOST`: The hostname of the PostgreSQL database.
- `DB_PORT`: The port number of the PostgreSQL database.
- `DB_USER`: The username for the PostgreSQL database.
- `DB_PASSWORD`: The password for the PostgreSQL database.
- `DB_DATABASE`: The name of the PostgreSQL database.

#### `REDIS_URL`

The URL of the Redis instance used for caching and session management. Example:

```txt
REDIS_URL=redis://default:password@redis-host:6379
```

#### `AUTH_SERVICE_HOST`

The host URL of the authentication service. Example:

```txt
AUTH_SERVICE_HOST=https://auth.example.com
```

#### `ORIGINS`

A comma-separated list of allowed origins for CORS and trusted origins for authentication. Example:

```txt
ORIGINS=https://next.app.budget-buddy.de,https://next.backend.budget-buddy.de
```

#### `METAL_API_KEY`

API key for [metalpriceapi.com](https://metalpriceapi.com/), used for retrieving metal prices. Example:

```txt
METAL_API_KEY=your_api_key_here
```
