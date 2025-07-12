import {LogLevel} from '@budgetbuddyde/utils';
import {type NextFunction, type Request, type Response} from 'express';

import {logger} from '../core/logger';

export const requestLogger = logger.child({scope: 'request'});

export function log(req: Request, res: Response, next: NextFunction): void {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = process.hrtime();
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = Number((seconds * 1000 + nanoseconds / 1e6).toFixed(2)); // Convert to milliseconds and format

    const statusCode = res.statusCode;
    const targetLogLevel: LogLevel =
      statusCode >= 200 && statusCode < 400
        ? LogLevel.INFO
        : statusCode >= 400 && statusCode < 500
          ? LogLevel.WARN
          : LogLevel.ERROR;
    const requestMetaInformation = {
      requestId: requestId,
      method: req.method,
      ip: req.ip,
      baseUrl: req.baseUrl,
      url: req.originalUrl,
      responseTime: `${durationMs} ms`,
      responseTimeInMillis: durationMs,
      responseCode: statusCode,
    };

    const msg = `[${requestMetaInformation.ip}] ${req.method} ${req.originalUrl} ${statusCode} - ${requestMetaInformation.responseTimeInMillis}`;
    switch (targetLogLevel) {
      case LogLevel.ERROR:
        requestLogger.error(msg, requestMetaInformation);
        break;
      case LogLevel.WARN:
        requestLogger.warn(msg, requestMetaInformation);
        break;
      case LogLevel.INFO:
      default:
        requestLogger.info(msg, requestMetaInformation);
    }
  });

  next();
}
