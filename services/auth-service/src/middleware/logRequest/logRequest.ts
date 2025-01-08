import {format} from 'date-fns';
import type {NextFunction, Request, Response} from 'express';

import {logger} from '../../core/logger';

export type TLogType = 'LOG' | 'INFO' | 'WARN' | 'ERROR';

/**
 * Middleware function to log HTTP requests and responses.
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next middleware function.
 */
export function logRequest(req: Request, res: Response, next: NextFunction) {
  if (req.path.includes('favicon') || req.path === '/status') return next();

  const start = process.hrtime();

  res.on('finish', async () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2); // Convert to milliseconds and format

    const statusCode = res.statusCode;
    const type: TLogType =
      statusCode >= 200 && statusCode < 400 ? 'INFO' : statusCode >= 400 && statusCode < 500 ? 'WARN' : 'ERROR';
    const logMetaInformation = {
      method: req.method,
      ip: req.ip,
      location: req.originalUrl,
      body: req.body,
      query: req.query,
      header: {authorization: req.headers.authorization},
      statusCode,
      requestMethod: req.method,
      path: req.originalUrl,
      responseTime: `${durationMs} ms`,
      responseTimeInMillis: durationMs,
    };

    const msg = `[${format(new Date(), 'yyyy/MM/dd HH:mm:ss')}] "HTTP/${
      req.httpVersion
    } ${req.method} ${req.path}" from ${req.ip} - ${res.statusCode} in ${durationMs}ms "${req.get('user-agent')}"`;
    switch (type) {
      case 'ERROR':
        logger.error(msg, logMetaInformation);
        break;

      case 'WARN':
        logger.warn(msg, logMetaInformation);
        break;

      case 'INFO':
      default:
        logger.info(msg, logMetaInformation);
        break;
    }
  });
  next();
}
