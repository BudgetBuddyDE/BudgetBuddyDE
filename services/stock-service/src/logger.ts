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
          }),
        ]
      : []),
  ],
});
