import {ConsoleTransport, createLogger, LogLevel} from '../src';

const logger = createLogger({
  label: 'ConsoleLogger',
  transports: [],
  level: LogLevel.INFO,
  hideMeta: true,
});

logger.info('This is an info message');

logger.warn('This warns about something and will provide some metadata', {field1: 'value1', field2: 'value2'});

const childLogger = logger.child({
  label: 'ChildLogger',
  transports: [
    new ConsoleTransport({
      label: 'ChildLogger',
      format(_dateTime, _level, label, message, _meta) {
        return `[CUSTOM] ${label}: ${message}`;
      },
    }),
  ],
});

childLogger.info('This is an info message from the child logger', {meta: 'data'});
