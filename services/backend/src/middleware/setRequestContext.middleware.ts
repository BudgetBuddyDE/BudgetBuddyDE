import type {NextFunction, Request, Response} from 'express';
import {auth} from '../auth';
import {logger as mainLogger} from '../lib/logger';
import {ApiResponse, HTTPStatusCode} from '../models';
import type {RequestContext} from '../types';

const logger = mainLogger.child({module: 'auth', middleware: 'setRequestContext'});

/** Only authentication credentials are passed to the local session lookup. */
const FORWARDED_AUTH_HEADERS = ['cookie', 'authorization', 'x-api-key'] as const;

function buildAuthHeaders(req: Request): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_AUTH_HEADERS) {
    const value = req.headers[name];
    if (Array.isArray(value)) headers.set(name, value.join(', '));
    else if (value !== undefined) headers.set(name, value);
  }
  return headers;
}

export async function setRequestContext(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({headers: buildAuthHeaders(req)}).catch((error: unknown) => {
    logger.error('Authentication failed', error instanceof Error ? error : new Error(String(error)));
    return undefined;
  });

  if (session === undefined) {
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.SERVICE_UNAVAILABLE)
      .withMessage('Authentication failed')
      .buildAndSend(res);
  }

  if (!session) {
    logger.warn('No session data found');
    return ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
  }

  const context: RequestContext = {
    user: session.user,
    session: session.session,
  };
  logger.debug('Request context set', {userId: context.user?.id});

  req.context = context;
  res.locals.context = context;

  next();
}
