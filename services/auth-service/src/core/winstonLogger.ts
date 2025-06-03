import {type LogLevel} from '@budgetbuddyde/utils';
import winston from 'winston';
import LokiTransport from 'winston-loki';

export function initWinstonLogger(
  options: {level: LogLevel; environment: string},
  meta: {[key: string]: string | number},
): winston.Logger {
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
      ...(options.environment === 'production' && process.env.LOKI_HOST !== undefined && process.env.LOGI_HOST !== ''
        ? [
            new LokiTransport({
              host: process.env.LOKI_HOST,
              labels: meta,
            }),
          ]
        : []),
    ],
  });
}
