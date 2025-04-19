import {getLogLevel} from '@budgetbuddyde/utils';
import winston from 'winston';
import LokiTransport from 'winston-loki';

import {config} from './config';

const META_INFORMATION = {
  service: config.appName,
  version: config.version,
  environment: config.environment,
  project: 'budgetbuddyde',
};

console.log('Logger initialized with config:', META_INFORMATION, process.env.LOKI_HOST);

export const logger = winston.createLogger({
  level: getLogLevel(),
  defaultMeta: META_INFORMATION,
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
    ...(config.environment === 'production' && process.env.LOKI_HOST !== undefined && process.env.LOGI_HOST !== ''
      ? [
          new LokiTransport({
            host: process.env.LOKI_HOST,
            // useWinstonMetaAsLabels: true,
            labels: META_INFORMATION,
            onConnectionError(error) {
              logger.error('Error connecting to Loki', error);
            },
          }),
        ]
      : []),
  ],
});
