import {randomUUID} from 'node:crypto';
import type {LogLevel} from '@budgetbuddyde/logger';
import type {NextFunction, Request, Response} from 'express';
import {config} from '../config';
import {logger} from '../lib/logger';
import type {RequestContext} from '../types';

export const requestLogger = logger.child({module: 'request'});

export function logRequest(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();
  const requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const statusCode = res.statusCode;
    const targetLogLevel: LogLevel =
      statusCode >= 200 && statusCode < 400 ? 'info' : statusCode >= 400 && statusCode < 500 ? 'warn' : 'error';
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const requestMetaInformation = {
      method: req.method,
      ip: req.ip,
      originalUrl: req.originalUrl,
      url: `http://localhost:${config.port}${req.originalUrl}`,
      responseCode: statusCode,
      origin: req.headers.origin || req.headers['X-Served-By'] || 'unknown',
      requestId,
      durationMs,
      userId: (req as {context?: RequestContext}).context?.user?.id,
    };

    const msg = `[${requestMetaInformation.ip}] ${req.method} ${req.originalUrl} ${statusCode}`;
    switch (targetLogLevel) {
      case 'error':
        requestLogger.error(msg, requestMetaInformation);
        break;
      case 'warn':
        requestLogger.warn(msg, requestMetaInformation);
        break;
      default:
        requestLogger.info(msg, requestMetaInformation);
    }
  });

  next();
}
