import {createLogger, format, transports} from 'winston';
import LokiTransport from 'winston-loki';
import {config} from '../config';

export const logger = createLogger({
  defaultMeta: {
    service: config.service,
    version: config.version,
    runtime: config.runtime,
  },
  format: format.combine(
    format.colorize(),
    format.timestamp(), // ISO 8601
    format.errors({stack: true}),
    format.splat(),
    format.simple(),
  ),
  transports: [
    ...(config.runtime === 'production' && Boolean(process.env.LOKI_URL)
      ? [
          new LokiTransport({
            host: process.env.LOKI_URL || 'http://loki:3100',
            // In production, we want to use metadata as labels for better filtering
            useWinstonMetaAsLabels: true
          }),
        ]
      : []),
    new transports.Console(),
  ],
});
