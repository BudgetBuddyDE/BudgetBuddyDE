import {createLogger, type Logger} from '@budgetbuddyde/logger';
import {createWinstonLogEventWriter} from '@budgetbuddyde/logger/winston';
import {createLogger as createWinstonLogger, format, transports} from 'winston';
import LokiTransport from 'winston-loki';
import {config} from '../config';

const winstonLogger = createWinstonLogger({
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
  },
  level: config.log.level === 'silent' ? 'error' : config.log.level,
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    ...(config.runtime === 'production' && Boolean(process.env.LOKI_URL)
      ? [
          new LokiTransport({
            host: process.env.LOKI_URL || 'http://loki:3100',
            useWinstonMetaAsLabels: false,
          }),
        ]
      : []),
    new transports.Console(),
  ],
});

export const logger: Logger = createLogger(createWinstonLogEventWriter(winstonLogger), {
  context: {
    service: config.service,
    version: config.version,
    runtime: config.runtime,
  },
  threshold: config.log.level,
});
