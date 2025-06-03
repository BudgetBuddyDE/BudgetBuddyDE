import {type LogLevel} from '@budgetbuddyde/utils';
import {type NextFunction, type Request, type Response} from 'express';

import {logger} from '../core/logger';

export const requestLogger = logger.child({label: 'request'});

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
      statusCode >= 200 && statusCode < 400 ? 'info' : statusCode >= 400 && statusCode < 500 ? 'warn' : 'error';
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
    requestLogger[targetLogLevel](msg, requestMetaInformation);
  });

  next();
}
