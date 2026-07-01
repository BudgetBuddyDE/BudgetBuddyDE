import type {NextFunction, Request, Response} from 'express';
import {extractRequestAuth} from '../lib/requestAuth';

/**
 * Middleware that enforces request authentication via Authorization or X-Api-Key.
 */
export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestAuth = extractRequestAuth(req);

  if (!requestAuth) {
    res.status(401).json({
      error: 'Unauthorized – provide an Authorization token or X-Api-Key header',
    });
    return;
  }

  res.locals.requestAuth = requestAuth;
  next();
}
