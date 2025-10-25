# `@budgetbuddyde/logger`

![CI](https://ci.tools.tklein.it/api/v1/teams/main/pipelines/logger.js/badge)
![NPM Version](https://img.shields.io/npm/v/%40tklein1801%2Flogger.js)
![NPM License](https://img.shields.io/npm/l/%40tklein1801%2Flogger.js)
![NPM Last Update](https://img.shields.io/npm/last-update/%40tklein1801%2Flogger.js)

A flexible and efficient JavaScript/TypeScript logging library with modular transport system, built-in batching, and debouncing capabilities for high-performance applications.

## Features

- **Modular Architecture**: Logger, Transport Manager, and pluggable transport system
- **Multiple Transports**: Send logs to console, files, HTTP endpoints, or custom destinations
- **Built-in Batching**: Reduce overhead by grouping logs before transmission
- **Debouncing**: Optimizes performance during high-frequency logging
- **Child Loggers**: Create scoped loggers that inherit parent configuration
- **TypeScript Support**: Fully typed with comprehensive type definitions
- **Configurable Log Levels**: Filter logs by severity (DEBUG, INFO, WARN, ERROR)

## Installation

```bash
npm install @budgetbuddyde/logger
```

## Quick Start

### Basic Usage

```typescript
import { LogLevel, createLogger } from '@budgetbuddyde/logger';

const logger = createLogger({
  label: 'MyApp',
  level: LogLevel.INFO,
});

logger.info('Application started');
logger.warn('This is a warning');
logger.error('An error occurred');
```

### Child Loggers

Create scoped loggers that inherit parent configuration:

```typescript
const childLogger = logger.child({
  label: 'Database',
  level: LogLevel.DEBUG,
});

childLogger.debug('Database connection established');
```

### Multiple Transports

Send logs to multiple destinations with different configurations:

```typescript
import { LogLevel, createLogger, Transport, type LogEntry } from '@budgetbuddyde/logger';

class FileTransport extends Transport {
  protected sendBatch(logs: LogEntry[]): void {
    logs.forEach((log) => console.log(`[FILE] ${log.message}`));
  }
}

const logger = createLogger({
  label: 'MultiTransportApp',
  level: LogLevel.INFO,
  transports: [
    new FileTransport({
      label: 'file',
      batchSize: 10,
      debounceMs: 1000,
      level: LogLevel.WARN, // Only warnings and errors to file
    }),
  ],
});
```

## Transport System

The transport system handles efficient log transmission with built-in optimizations:

- **Batching**: Groups logs to reduce transmission overhead
- **Debouncing**: Delays transmission to avoid overwhelming receivers
- **Level Filtering**: Processes only logs meeting minimum severity
- **Error Recovery**: Automatically re-queues failed logs for retry

## Custom Transports

> [!TIP]
> Inside the `examples` folder, you can find some custom transport implementations.

Create custom transports by extending the `Transport` base class:

```typescript
import { Transport, type LogEntry, type TransportOptions } from '@budgetbuddyde/logger';

class DatabaseTransport extends Transport {
  constructor(options: TransportOptions & { connectionString: string }) {
    super(options);
  }

  protected async sendBatch(logs: LogEntry[]): Promise<void> {
    // Send logs to your database
    for (const log of logs) {
      await this.saveLog(log);
    }
  }

  private async saveLog(log: LogEntry): Promise<void> {
    // Your database implementation
  }
}

const logger = createLogger({
  transports: [
    new DatabaseTransport({
      label: 'database',
      connectionString: 'mongodb://localhost:27017/logs',
      batchSize: 20,
      debounceMs: 2000,
    }),
  ],
});
```

### Transport Configuration

Configure transport behavior with these options:

- `batchSize`: Number of logs to group before transmission (default: 10)
- `debounceMs`: Delay before sending logs in milliseconds (default: 1000)
- `level`: Minimum log level to process (default: LogLevel.INFO)
- `enabled`: Whether the transport is active (default: true)
- `label`: Transport identifier for debugging

## API Reference

### Log Levels

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
```

### Logger Methods

- `logger.debug(message, ...args)` - Debug level logging
- `logger.info(message, ...args)` - Info level logging
- `logger.warn(message, ...args)` - Warning level logging
- `logger.error(message, ...args)` - Error level logging
- `logger.child(options)` - Create child logger with inherited config

### Transport Lifecycle

- `transport.enable()` - Enable the transport
- `transport.disable()` - Disable and flush remaining logs
- `transport.flush()` - Immediately send all queued logs
- `transport.destroy()` - Clean up resources

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build package
npm run build

# Lint and format
npm run check
```

## Credits

- `lodash.debounce` - Used for debouncing the transportation of logs in the Transport system to reduce load on receivers and improve batching efficiency. This ensures that during high-frequency logging periods, logs are accumulated and sent in batches rather than individually, optimizing performance and reducing network overhead.
