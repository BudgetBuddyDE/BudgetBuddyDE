# `@budgetbuddyde/logger`

`@budgetbuddyde/logger` provides one runtime-neutral logging contract. Browser and uninitialized Node runtimes write to the console. Node applications can initialize the shared Winston pipeline with the explicit `@budgetbuddyde/logger/node` entry.

## Application logging

```typescript
import {createLogger, getLogLevel} from '@budgetbuddyde/logger';

export const logger = createLogger({
  context: {service: 'backend', version: '1.0.0', runtime: 'production'},
  threshold: getLogLevel(process.env.LOG_LEVEL),
});

logger.info('Started on port %d', 9000, {requestId: 'req_123'});
logger.error('Request failed', new Error('connection refused'), {requestId: 'req_123'});
```

The logger supports `trace`, `debug`, `info`, `warn`, `error`, and `child(context)`. Messages support `%s`, `%d`, `%j`, and `%%`. Root context, child context, and call metadata merge in that order. Call metadata uses the final plain object when it exceeds the consuming placeholder count.

Known credentials are redacted from messages, errors, and nested metadata before any sink receives an event. The logger clones normalized data and does not modify caller objects. User identifiers and IP addresses remain available.

## Node initialization

```typescript
import {initializeLogging, shutdownLogging} from '@budgetbuddyde/logger/node';

initializeLogging({context: {service: 'backend'}, level: 'info'});
// During application shutdown:
await shutdownLogging();
```

Initialization is idempotent. It always installs Winston for Node output. Setting `OTEL_EXPORTER_OTLP_ENDPOINT` also enables batched OTLP log export. The standard OTLP protocol and header environment variables remain supported. The active OpenTelemetry trace context is attached to each exported log record.

The logger package does not install process signal handlers. Applications coordinate `shutdownLogging()` with their tracing shutdown.

## Compatibility helpers

`createLogger`, `createNoopLogger`, `getLogLevel`, and the shared `logger` remain available from the package root. The `@budgetbuddyde/logger/console` entry exposes the browser-safe console sink and formatter for custom integrations.
