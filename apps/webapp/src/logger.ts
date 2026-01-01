import {createLogger, LogLevel} from '@tklein1801/logger.js';

export const logger = createLogger({
  scope: 'webapp',
  level: LogLevel.INFO,
});
