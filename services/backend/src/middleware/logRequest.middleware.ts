import {LogLevel} from '@budgetbuddyde/logger';
import type {NextFunction, Request, Response} from 'express';
import {config} from '../config';
import {logger} from '../lib/logger';

export const requestLogger = logger.child({label: 'request'});

export function logRequest(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    const statusCode = res.statusCode;
    const targetLogLevel: LogLevel =
      statusCode >= 200 && statusCode < 400
        ? LogLevel.INFO
        : statusCode >= 400 && statusCode < 500
          ? LogLevel.WARN
          : LogLevel.ERROR;
    const requestMetaInformation = {
      method: req.method,
      ip: req.ip,
      originalUrl: req.originalUrl,
      url: `http://localhost:${config.port}${req.originalUrl}`,
      responseCode: statusCode,
      origin: req.headers.origin || req.headers['X-Served-By'] || 'unknown',
    };

    const msg = `[${requestMetaInformation.ip}] ${req.method} ${req.originalUrl} ${statusCode}`;
    switch (targetLogLevel) {
      case LogLevel.ERROR:
        requestLogger.error(msg, requestMetaInformation);
        break;
      case LogLevel.WARN:
        requestLogger.warn(msg, requestMetaInformation);
        break;
      default:
        requestLogger.info(msg, requestMetaInformation);
    }
  });

  next();
}
