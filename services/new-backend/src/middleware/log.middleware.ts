import { LogLevel } from '@budgetbuddyde/logger';
import type { NextFunction, Request, Response } from 'express';

import { logger } from '../lib/logger';

export const requestLogger = logger.child({ label: 'request' });

export function log(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.context.requestId;
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

    const msg = `[${requestMetaInformation.ip}] ${req.method} ${req.originalUrl} ${statusCode} - ${requestMetaInformation.responseTimeInMillis} ms`;
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
