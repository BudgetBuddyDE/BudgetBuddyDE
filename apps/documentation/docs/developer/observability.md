---
title: Observability
description: Logs, metrics, tracing, dashboards, and incident response.
icon: lucide/activity
status: active
tags: [developer, observability, monitoring]
---

# Observability

Observability documentation is split by audience. Operators need actionable health and log checks; developers need instrumentation and diagnostic details.

## Existing references

- [OpenTelemetry](../monitoring/open-telemetry.md)
- [Grafana](../monitoring/grafana.md)

## Documentation requirements

New services and important workflows should document:

- Structured log events and fields
- Health and readiness behavior
- Metrics and useful labels
- Trace boundaries and correlation identifiers
- Dashboard ownership and alert meaning
- Incident response and safe data redaction

Operator procedures remain in [Operations and maintenance](../user/operations.md). Never expose secrets or personal financial data in logs, metrics, traces, screenshots, or issue reports.
