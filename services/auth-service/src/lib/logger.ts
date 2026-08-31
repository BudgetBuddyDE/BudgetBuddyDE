import {createLogger} from '@budgetbuddyde/logger';
import {createWinstonLogEventWriter} from '@budgetbuddyde/logger/winston';
import {createLogger as createWinstonLogger, format, transports} from 'winston';
import LokiTransport from 'winston-loki';
import {config} from '../config';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
} as const;

const winstonLogger = createWinstonLogger({
  levels,
  level: config.log.level === 'silent' ? 'error' : config.log.level,
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    ...(config.runtime === 'production' && config.log.lokiUrl
      ? [
          new LokiTransport({
            host: config.log.lokiUrl,
            useWinstonMetaAsLabels: false,
          }),
        ]
      : []),
    new transports.Console(),
  ],
});

export const logger = createLogger(createWinstonLogEventWriter(winstonLogger), {
  context: {
    service: config.service,
    version: config.version,
    runtime: config.runtime,
  },
  threshold: config.log.level,
});
