import {type LogLevel} from '@budgetbuddyde/utils';
import 'dotenv/config';
import winston from 'winston';
import LokiTransport from 'winston-loki';

export function initWinstonLogger(options: {level: LogLevel}, meta: {[key: string]: string | number}): winston.Logger {
  const {LOKI_HOST} = process.env;
  return winston.createLogger({
    level: options.level,
    defaultMeta: meta,
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
      ...(LOKI_HOST !== undefined && LOKI_HOST !== ''
        ? [
            new LokiTransport({
              host: LOKI_HOST,
              labels: meta,
            }),
          ]
        : []),
    ],
  });
}
