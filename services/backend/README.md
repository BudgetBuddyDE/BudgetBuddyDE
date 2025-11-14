# Backend

![CI](https://ci.tklein.it/api/v1/teams/budgetbuddyde/pipelines/backend/jobs/build-backend/badge)

## Deployment

### Environment Variables

#### Database Configuration

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
