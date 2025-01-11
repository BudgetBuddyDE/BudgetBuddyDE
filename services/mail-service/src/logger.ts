import {getLogLevel} from '@budgetbuddyde/utils';
import winston from 'winston';

import {config} from './config';

/**
 * The logger instance for the stock service.
 */
export const logger = winston.createLogger({
  level: getLogLevel(),
  defaultMeta: {
    service: config.appName,
    version: config.version,
    environment: config.environment,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({all: true}),
        winston.format.errors({stack: true}),
        winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
        winston.format.align(),
        winston.format.splat(),
        winston.format.printf(({timestamp, level, message, stack}) => {
          return `${timestamp} ${level}: ${stack || message}`;
        }),
      ),
    }),
  ],
});
