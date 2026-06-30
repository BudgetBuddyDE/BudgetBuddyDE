import {buildConsoleFormat, LevelConfig} from '@budgetbuddyde/logger';
import type {NextFunction, Request, Response} from 'express';
import {createLogger, format, transports} from 'winston';
import {config} from '../config';

export const logger = createLogger({
  levels: LevelConfig.levels,
  level: config.logLevel,
  defaultMeta: {service: config.service, version: config.version},
  format: format.combine(
    format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    format.splat(),
    format.colorize({level: config.runtime === 'development', colors: LevelConfig.colors}),
    buildConsoleFormat(config.service),
  ),
  transports: [new transports.Console()],
});

export function logRequest(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    const status = res.statusCode;
    const msg = `[${req.ip}] ${req.method} ${req.originalUrl} ${status}`;
    const meta = {method: req.method, url: req.originalUrl, status};
    if (status >= 500) logger.error(msg, meta);
    else if (status >= 400) logger.warn(msg, meta);
    else logger.info(msg, meta);
  });
  next();
}
