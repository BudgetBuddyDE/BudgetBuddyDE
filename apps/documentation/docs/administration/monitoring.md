---
title: Monitoring
description: Monitor health, logs, and runtime behavior.
icon: lucide/activity
---

## Health Checks

The auth service and backend provide status endpoints at `/health` and `/status`. The response contains the service status and the reachability of the database and Redis.

A service can report the `degraded` status when a dependency is unreachable. Monitor the HTTP status, response time, and individual dependency fields.

## Logs

The services log startup parameters, requests, errors, and scheduled tasks. Secrets, session data, and financial content must not be written to logs.

Set `LOG_LEVEL` to control structured Console output. Services write formatted log lines to stdout, where the deployment platform can collect them.

## Important Alerts

- Health check unsuccessful
- Database or Redis unreachable
- Repeated authentication failures
- High API error rate
- Migration failed
- Error processing recurring payments
- Memory or disk space exhaustion
