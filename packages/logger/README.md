# `@budgetbuddyde/logger`

Runtime-neutral structured logging for BudgetBuddyDE. The root package has no Node.js or Winston runtime dependency and is safe to use in browsers.

## Logger And Sinks

```typescript
import {createLogger, getLogLevel} from '@budgetbuddyde/logger';
import {createConsoleSink} from '@budgetbuddyde/logger/console';

const logger = createLogger({
  sinks: [createConsoleSink()],
  context: {service: 'backend'},
  threshold: getLogLevel(process.env.LOG_LEVEL),
});

logger.info('Started on port %d', 9000, {requestId: 'req_123'});
logger.error('Request failed', new Error('connection refused'), {requestId: 'req_123'});
```

`Logger` is the log client. It provides `trace`, `debug`, `info`, `warn`, `error`, and `child`. A `LogSink` receives normalized events; configure as many sinks as needed. Levels are `trace`, `debug`, `info`, `warn`, and `error`; `LogThreshold` additionally supports `silent`. `getLogLevel` defaults invalid values to `info` and maps the legacy `crit` value to `error`.

Messages support `%s`, `%d`, `%j`, and `%%` without Node's `util.format`. Errors are emitted as the raw `event.error`. The last plain object is call metadata only when there are more non-error arguments than consuming template placeholders. Context precedence is root, child, then call metadata. Context keys cannot replace `level`, `message`, or `error`.

Use `createNoopLogger()` for a logger that drops events.

## Sinks

```typescript
import {createConsoleSink} from '@budgetbuddyde/logger/console';
import {createLogger} from '@budgetbuddyde/logger';

const logger = createLogger({sinks: [createConsoleSink()]});
```

Winston is an optional peer dependency and is isolated to the Winston subpath:

```typescript
import {createWinstonSink} from '@budgetbuddyde/logger/winston';
import {createLogger} from '@budgetbuddyde/logger';
import winston from 'winston';

const logger = createLogger({
  sinks: [createWinstonSink(winston.createLogger())],
});
```

Sinks receive each event in declaration order. The Console sink is browser-safe. The Winston sink writes event objects directly without `format.splat()` and serializes errors with their name, message, stack, cause, and own properties.

## Testing

```typescript
import {MemoryLogger} from '@budgetbuddyde/logger/testing';

const logger = new MemoryLogger({context: {service: 'test'}});
logger.child({requestId: 'req_123'}).info('Saved', {entityId: 'entity_123'});

expect(logger.events).toHaveLength(1);
```
