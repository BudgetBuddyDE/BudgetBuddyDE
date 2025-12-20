import {ConsoleTransport, createLogger, LogLevel} from '@budgetbuddyde/logger';

export const logger = createLogger({
  label: 'app',
  level: LogLevel.DEBUG,
  transports: [
    new ConsoleTransport({
      debounceMs: 0,
      batchSize: 1,
    }),
  ],
});
