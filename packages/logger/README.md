# `@budgetbuddyde/logger`

Runtime-neutral structured logging for BudgetBuddyDE. The root package has no Node.js or Winston runtime dependency and is safe to use in browsers.

## Core API

```typescript
import {createLogger, getLogLevel, type LogEventWriter} from '@budgetbuddyde/logger';

const write: LogEventWriter = event => sendToObservability(event);
const logger = createLogger(write, {
  context: {service: 'backend'},
  threshold: getLogLevel(process.env.LOG_LEVEL),
});

logger.info('Started on port %d', 9000, {requestId: 'req_123'});
logger.error('Request failed', new Error('connection refused'), {requestId: 'req_123'});
```

`Logger` provides `trace`, `debug`, `info`, `warn`, `error`, and `child`. Levels are `trace`, `debug`, `info`, `warn`, and `error`; `LogThreshold` additionally supports `silent`. `getLogLevel` defaults invalid values to `info` and maps the legacy `crit` value to `error`.

Messages support `%s`, `%d`, `%j`, and `%%` without Node's `util.format`. Errors are emitted as the raw `event.error`. The last plain object is call metadata only when there are more non-error arguments than consuming template placeholders. Context precedence is root, child, then call metadata. Context keys cannot replace `level`, `message`, or `error`.

Use `createNoopLogger()` for a logger that drops events.

## Adapters

```typescript
import {createConsoleLogEventWriter} from '@budgetbuddyde/logger/console';
import {createLogger} from '@budgetbuddyde/logger';

const logger = createLogger(createConsoleLogEventWriter());
```

Winston is an optional peer dependency and is isolated to the Winston subpath:

```typescript
import {createWinstonLogEventWriter} from '@budgetbuddyde/logger/winston';
import {createLogger} from '@budgetbuddyde/logger';
import winston from 'winston';

const logger = createLogger(createWinstonLogEventWriter(winston.createLogger()));
```

The Winston adapter writes event objects directly and does not use `format.splat()`. It serializes errors with their name, message, stack, cause, and own properties.

## Testing

```typescript
import {MemoryLogger} from '@budgetbuddyde/logger/testing';

const logger = new MemoryLogger({context: {service: 'test'}});
logger.child({requestId: 'req_123'}).info('Saved', {entityId: 'entity_123'});

expect(logger.events).toHaveLength(1);
```
