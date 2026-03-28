---
title: Grafana
icon: lucide/combine
tags: 
    - service
    - monitoring
---

## Overview

A self-hosted Grafana instance is used to provide metrics and dashboards for the various services. Grafana allows visualizing and monitoring data from different sources. For this, a pre-configured setup with multiple services is used, including Prometheus as a data source for metrics, Loki for logs, and Tempo for traces.

For the basic configuration of the services, the [railway-grafana-stack](https://github.com/MykalMachon/railway-grafana-stack) template was used and subsequently adapted for our services and deployment in the Railway Cloud.

!!! note
    The configuration stored in the repository under `/monitoring` is adapted to our services and operation in the Railway Cloud runtime environment. If the services are deployed on a VPS or locally, adjustments to the configuration may be necessary for a smooth experience.

## Architecture

All monitoring services are deployed as separate Railway services and communicate exclusively via **Railway Private Networking** (internal hostnames). No telemetry data travels over the public internet.

```
Your Services  ──OTLP/HTTP──►  Tempo   (traces)   ──► S3 Bucket
               ──Push Logs──►  Loki    (logs)     ──► S3 Bucket
               ──Scrape────►  Prometheus (metrics) ──► Railway Volume
                                    │
                                    ▼
                                 Grafana  (port 3000, public)
```

Log chunks and traces are persisted in an **S3-compatible object store**. Prometheus metrics are stored on a Railway volume (Prometheus does not natively support S3 without a Thanos sidecar).

## Storage: S3 Object Store

Loki and Tempo are configured to store their data in an S3-compatible bucket. The following environment variables must be set on the respective Railway services:

| Variable | Service | Description | Example |
|----------|---------|-------------|---------|
| `S3_ENDPOINT` | Loki, Tempo | S3-compatible endpoint URL | `https://s3.eu-central-1.amazonaws.com` |
| `S3_REGION` | Loki, Tempo | Bucket region | `eu-central-1` |
| `S3_ACCESS_KEY_ID` | Loki, Tempo | S3 access key ID | – |
| `S3_SECRET_ACCESS_KEY` | Loki, Tempo | S3 secret access key | – |
| `LOKI_S3_BUCKET` | Loki | Bucket name for log chunks | `my-loki-bucket` |
| `TEMPO_S3_BUCKET` | Tempo | Bucket name for traces | `my-tempo-bucket` |

!!! tip
    Any S3-compatible provider works (AWS S3, Cloudflare R2, MinIO, etc.). For Cloudflare R2, set `S3_REGION` to `auto` and `S3_ENDPOINT` to your R2 account endpoint.

## Services

!!! note
    The services described here (Grafana, Loki, Prometheus, Tempo) and associated configurations refer to the necessary configurations of the "monitoring services" in the Railway Cloud.

!!! warning
    In the current configuration, authentication mechanisms are disabled (e.g., `auth_enabled: false` in Loki). This is acceptable for operation in a protected environment (e.g., Railway Cloud without public networking), but should be reconsidered and adapted in production environments with public access to prevent unauthorized access.

### Grafana

Grafana is deployed as a Docker container and is accessible via port `3000`. Configuration is primarily done via environment variables and provisioning files.

The data sources (Loki, Prometheus, Tempo) are automatically provisioned via `grafana/datasources/datasources.yml`. All three data sources are pre-connected and use Railway's private networking URLs.

Important environment variables:

| Variable | Description |
|----------|-------------|
| `GF_SECURITY_ADMIN_USER` | Admin username |
| `GF_SECURITY_ADMIN_PASSWORD` | Admin password |
| `GF_DEFAULT_INSTANCE_NAME` | Instance name shown in the UI |
| `GF_INSTALL_PLUGINS` | Comma-separated list of plugins to pre-install |
| `LOKI_INTERNAL_URL` | Internal Railway URL to the Loki service |
| `PROMETHEUS_INTERNAL_URL` | Internal Railway URL to the Prometheus service |
| `TEMPO_INTERNAL_URL` | Internal Railway URL to the Tempo query endpoint |

---

### Loki

Loki is responsible for log aggregation. The service runs on port `3100`.

Log **chunks** are stored in the configured S3 bucket (`LOKI_S3_BUCKET`). The TSDB index and cache are written to a local Railway volume (`/loki`) to allow fast lookups without additional S3 round-trips.

The configuration (`loki/loki.yml`) disables authentication (`auth_enabled: false`) and uses the `v13` schema with the `tsdb` store.

To send logs to Loki from other Railway services, reference the internal URL:

```
LOKI_URL=${{Grafana.LOKI_INTERNAL_URL}}
```

---

### Prometheus

Prometheus collects metrics from the various services. The service is accessible via port `9090`.

Metrics data is stored on a local Railway volume (`/prometheus`). Scrape targets are defined in `prometheus/prom.yml`. By default, Prometheus only scrapes itself. To add your own services, uncomment or extend the `scrape_configs` section:

```yaml
scrape_configs:
  - job_name: 'my-service'
    scheme: https
    static_configs:
      - targets: ['my-service.railway.internal:PORT']
```

!!! note
    Prometheus does not natively support S3 storage. Long-term object store support would require a [Thanos](https://thanos.io/) sidecar, which is not included in this setup.

---

### Tempo

Tempo serves as a backend for distributed tracing. It receives traces via **OTLP** (OpenTelemetry Protocol) on two ingest endpoints:

| Port | Protocol | Variable |
|------|----------|----------|
| `4317` | gRPC | `INTERNAL_GRPC_INGEST` |
| `4318` | HTTP | `INTERNAL_HTTP_INGEST` |

Trace data is stored in the configured S3 bucket (`TEMPO_S3_BUCKET`). A local WAL (Write-Ahead Log) is written to `/var/tempo/wal` on a Railway volume to prevent data loss during restarts.

To send traces from other Railway services, reference the ingest URLs:

```
OTEL_EXPORTER_OTLP_ENDPOINT=${{Tempo.INTERNAL_HTTP_INGEST}}
```

The HTTP ingest path for traces is `/v1/traces`.

## Connecting Your Services

To wire up another Railway service to the full observability stack, add these environment variable references:

```bash
# Logs
LOKI_URL=${{Grafana.LOKI_INTERNAL_URL}}

# Metrics (Prometheus scrapes your service – expose a /metrics endpoint)
# Add your service as a scrape target in prometheus/prom.yml

# Traces
OTEL_EXPORTER_OTLP_ENDPOINT=${{Tempo.INTERNAL_HTTP_INGEST}}
OTEL_SERVICE_NAME=my-service-name
```

## Sources & Resources

- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Tempo Documentation](https://grafana.com/docs/tempo/latest/)
- [railway-grafana-stack template](https://github.com/MykalMachon/railway-grafana-stack)
- [Locomotive – Loki transport for Railway logs](https://railway.com/template/jP9r-f)