# Traefik Gateway

This directory contains the file-based Traefik configuration for the public
BudgetBuddyDE gateway. Traefik uses no Docker labels or dashboard API here;
routes and upstreams are defined in `dynamic.yml`.

## Start locally

The default upstreams point to services running on the host machine:

```bash
docker compose --profile gateway up -d traefik
```

The gateway redirects HTTP to HTTPS. Local requests can use the generated
certificate with `curl -k` while production should use a valid DNS record and
Let's Encrypt certificate.

## Production setup

Before deploying the gateway:

1. Replace `admin@example.com` in `traefik.yml`.
2. Replace `prod.gateway.domain.de` in every router rule in `dynamic.yml`.
3. Replace `host.docker.internal` with private service DNS names or private IPs.
4. Keep the Auth-Service, Backend, and MCP service ports off the public
   internet.
5. Set `TRUST_PROXY_HOPS=1` on services that receive traffic through one
   trusted gateway proxy.
6. Deploy at least two gateway replicas behind the platform's public ingress.

The gateway must be the only public entry point. The gateway forwards
`Cookie`, `Authorization`, `X-Api-Key`, and normal forwarding headers. Session
and API-key validation remains the responsibility of the existing services.
The gateway applies transport security, routing, rate limits, security headers,
access logging, health checks, and upstream timeouts.

## Public routes

| Public URL            | Upstream path              |
| --------------------- | -------------------------- |
| `/auth/v1/api/auth/*` | Auth-Service `/api/auth/*` |
| `/auth/v1/api/me`     | Auth-Service `/api/me`     |
| `/backend/v1/api/*`   | Backend `/api/*`           |
| `/mcp/v1/mcp`         | MCP `/mcp`                 |

The gateway strips the versioned public prefix before forwarding. This keeps
the application service routes unchanged.

## Direct and gateway URLs

Applications only need a base URL. Both forms are supported:

```text
http://localhost:9000
https://prod.gateway.domain.de/backend/v1
```

The typed API client appends the same `/api/*` paths to either URL. The same
applies to the Auth-Service and MCP backend URL. Trailing slashes are removed
by the clients before paths are appended.

## Add a service

Add a service in `dynamic.yml` and provide:

1. A private upstream URL under `http.services`.
2. A health check under the load balancer.
3. A versioned router rule under `http.routers`.
4. A `stripPrefix` middleware if the public prefix differs from the internal
   service path.
5. A rate-limit, timeout, and security middleware profile.

Unknown routes are rejected. No automatic retries are configured because MCP
and API mutations may have side effects. Unreachable upstreams result in a
gateway error such as `502` or `504`; health checks remove unhealthy instances
from the load balancer.
