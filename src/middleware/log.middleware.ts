import type {NextFunction, Request, Response} from 'express';
import {logger} from '../core';

export type TLogType = 'LOG' | 'INFO' | 'WARN' | 'ERROR';

/**
 * Enum representing different log categories.
 */
export enum ELogCategory {
  SETUP = 'setup',
  AUTHENTIFICATION = 'authentication',
  DATABASE = 'database',
  STOCK = 'stock',
  STOCK_SUBSCRIPTION = 'stock:subscription',
  WEBSOCKET = 'websocket',
  BACKGROUND_JOB = 'background:job',
  POCKETBASE = 'pocketbase',
}

/**
 * Middleware function to log HTTP requests and responses.
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next middleware function.
 */
export function logMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path.includes('favicon') || req.path === '/status') return next();
  res.on('finish', async () => {
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
      user: req.user?.id ?? 'anonymous',
    };

    switch (type) {
      case 'ERROR':
        logger.error('{requestMethod} {statusCode} /{path}', logMetaInformation);
        break;

      case 'WARN':
        logger.warn('{requestMethod} {statusCode} /{path}', logMetaInformation);
        break;

      case 'INFO':
      default:
        logger.info('{requestMethod} {statusCode} /{path}', logMetaInformation);
        break;
    }
  });
  next();
}
