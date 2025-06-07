import cds from '@sap/cds';
import winston from 'winston';
import LokiTransport from 'winston-loki';

const META_INFORMATION = {
  service: 'backend',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  project: 'budgetbuddyde',
};

const format = winston.format.combine(
  winston.format.errors({stack: true}),
  winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
  winston.format.align(),
  winston.format.splat(),
  winston.format.printf(({timestamp, level, message, stack}) => {
    return `${timestamp} ${level}: ${stack || message}`;
  }),
);

cds.log.Logger = cds.log.winstonLogger({
  level: process.env.LOG_LEVEL || 'INFO',
  format: format,
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production' && process.env.LOKI_HOST !== undefined && process.env.LOGI_HOST !== ''
      ? [
          new LokiTransport({
            host: process.env.LOKI_HOST,
            labels: META_INFORMATION,
          }),
        ]
      : []),
  ],
});

export const config = {
  getLogger: (
    name: string = 'bb',
    options: Parameters<typeof cds.log>[1] = {
      label: 'BudgetBuddy',
    },
  ) => cds.log(name, options),
};
