import {type LogLevel} from '@budgetbuddyde/utils';
import 'dotenv/config';
import winston from 'winston';
import LokiTransport from 'winston-loki';

import {mapLogLevelForBetterAuth} from '../auth';

export function initWinstonLogger(options: {level: LogLevel}, meta: {[key: string]: string | number}): winston.Logger {
  const {LOKI_HOST} = process.env;
  return winston.createLogger({
    level: mapLogLevelForBetterAuth(options.level),
    defaultMeta: meta,
    transports: [
      new winston.transports.Console({
        format: winston.format.printf(({message, stack}) => {
          return `${stack || message}`;
        }),
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
