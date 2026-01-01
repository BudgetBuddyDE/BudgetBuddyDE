# `@budgetbuddyde/logger`

![CI](https://ci.tklein.it/api/v1/teams/budgetbuddyde/pipelines/logger/jobs/build-logger/badge)
![NPM Version](https://img.shields.io/npm/v/%40budgetbuddyde%2Flogger)
![NPM License](https://img.shields.io/npm/l/%40budgetbuddyde%2Flogger)
![NPM Last Update](https://img.shields.io/npm/last-update/%40budgetbuddyde%2Flogger)

A collection of utility functions, configurations, and formatters for Winston loggers used within the BudgetBuddy project.

## Features

- **Log Level Utilities**: Helper functions for parsing and validating log levels from environment variables
- **Console Format Builder**: Pre-configured Winston formatters for consistent console output
- **Level Padding**: Formatting for uniform level output in logs
- **Level Configuration**: Standardized log level configuration with colors for the entire project
- **TypeScript Support**: Fully typed with comprehensive type definitions
- **Winston Integration**: Seamless integration with Winston for all services and apps

## Installation

```bash
npm install @budgetbuddyde/logger
```

## Quick Start

### Log Level from Environment Variables

```typescript
import { getLogLevel } from '@budgetbuddyde/logger';

const logLevel = getLogLevel(process.env.LOG_LEVEL); // 'info', 'debug', 'warn', etc.
```

### Winston Logger with Custom Format

```typescript
import { createLogger, format } from 'winston';
import { buildConsoleFormat, padLevel, LevelConfig } from '@budgetbuddyde/logger';

export const logger = createLogger({
  levels: LevelConfig.levels,
  level: getLogLevel(process.env.LOG_LEVEL),
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.splat(),
    padLevel(5), // Pads level to 5 characters
    format.colorize({ level: true, colors: LevelConfig.colors }),
    buildConsoleFormat('MyService', false) // Show service name and meta
  ),
  transports: [new transports.Console()],
});

logger.info('Application started');
logger.warn('This is a warning');
logger.error('An error occurred');
```

## Usage in the Project

The logger package is used across all services (Backend, Auth-Service) and apps (WebApp) in the BudgetBuddy project to ensure consistent logging configuration and formatting.

### In the Backend Service

```typescript
import { createLogger, format } from 'winston';
import { buildConsoleFormat, padLevel, LevelConfig } from '@budgetbuddyde/logger';

export const logger = createLogger({
  levels: LevelConfig.levels,
  level: config.log.level,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.splat(),
    padLevel(5),
    format.colorize({ level: true, colors: LevelConfig.colors }),
    buildConsoleFormat(config.service, config.log.hideMeta)
  ),
  transports: config.log.transports,
});
```

### In the WebApp

For the WebApp, a simplified version using direct `createLogger` from the package is used (if available), or Winston is configured directly.

## API Reference

### Log Levels

```typescript
enum ELogLevel {
  SILENT = 'silent',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRIT = 'crit',
}

type LogLevel = keyof typeof LevelConfig.levels;
```

### Level Configuration

```typescript
const LevelConfig = {
  levels: {
    silent: 6,
    debug: 5,
    info: 3,
    warn: 2,
    error: 1,
    crit: 0,
  },
  colors: {
    silent: 'gray',
    debug: 'blue',
    info: 'green',
    warn: 'yellow',
    error: 'red',
    crit: 'magenta',
  },
};
```

### Utility Functions

#### `getLogLevel(logLevel: string | undefined): LogLevel`

Parses a log level from a string (e.g., environment variable) and returns a valid `LogLevel`.

```typescript
const level = getLogLevel(process.env.LOG_LEVEL); // 'info' as fallback
```

#### `buildConsoleFormat(fallbackLabel: string, hideMeta?: boolean)`

Creates a Winston format for console output with timestamp, level, label, and optional metadata.

#### `padLevel(whitespaceCount: number)`

A Winston format transformer that pads log levels to a uniform length and converts them to uppercase.

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

## Dependencies

- **Winston**: The package is designed as a peer dependency for Winston (^3.19.0) and provides utility functions for Winston loggers.
