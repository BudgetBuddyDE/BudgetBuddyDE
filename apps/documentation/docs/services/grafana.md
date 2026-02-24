# Grafana

## Overview

A self-hosted Grafana instance is used to provide metrics and dashboards for the various services. Grafana allows visualizing and monitoring data from different sources. For this, a pre-configured setup with multiple services is used, including Prometheus as a data source for metrics, Loki for logs, and Tempo for traces.

For the basic configuration of the services, the [railway-grafana-stack](https://github.com/MykalMachon/railway-grafana-stack) template was used and subsequently adapted for our services and deployment in the Railway Cloud.

> [!NOTE]
> The configuration stored in the repository under `/monitoring` is adapted to our services and operation in the Railway Cloud runtime environment. If the services are deployed on a VPS or locally, adjustments to the configuration may be necessary for a smooth experience.

## Services 

> [!NOTE]
> The services described here (Grafana, Loki, Prometheus, Tempo) and associated configurations refer to the necessary configurations of the "monitoring services" in the Railway Cloud.

> [!WARNING]
> In the current configuration, authentication mechanisms are disabled (e.g., `auth_enabled: false` in Loki). This is acceptable for operation in a protected environment (e.g., Railway Cloud without public networking), but should be reconsidered and adapted in production environments with public access to prevent unauthorized access.

### Grafana

Grafana is deployed as a Docker container and is accessible via port `3000`. Configuration is primarily done via environment variables and provisioning files.

Important environment variables:

- `GF_SECURITY_ADMIN_USER`: Admin username
- `GF_SECURITY_ADMIN_PASSWORD`: Admin password
- `LOKI_INTERNAL_URL`: URL to Loki
- `PROMETHEUS_INTERNAL_URL`: URL to Prometheus
- `TEMPO_INTERNAL_URL`: URL to Tempo (Query Endpoint must be specified)

The data sources (Loki, Prometheus, Tempo) are automatically provisioned via `datasources.yml`.

---

### Prometheus

Loki is responsible for log aggregation. The service runs on port `3100` and stores data in the file system (`/loki`).
The configuration (`loki.yml`) is adapted so that no authentication is required (`auth_enabled: false`) and data is persisted locally.

---

### Loki

Prometheus collects metrics from the various services. The service is accessible via port `9090`.
The scrape targets are defined in `prom.yml`. By default, Prometheus monitors itself. Additional services must be added here to retrieve their metrics.

---

### Tempo

Tempo serves as a backend for distributed tracing. It receives traces via OTLP (OpenTelemetry Protocol).