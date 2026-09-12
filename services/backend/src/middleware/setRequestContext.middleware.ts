import type {NextFunction, Request, Response} from 'express';
import {config} from '../config';
import {authClient, logger as mainLogger} from '../lib';
import {ApiResponse, HTTPStatusCode} from '../models';
import type {RequestContext} from '../types';

const logger = mainLogger.child({module: 'auth', middleware: 'setRequestContext'});

/** Only credentials the auth service needs are forwarded upstream. */
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
  const session = await authClient
    .getSession({
      fetchOptions: {
        headers: buildAuthHeaders(req),
        signal: AbortSignal.timeout(config.auth.requestTimeoutMs),
      },
    })
    .catch((error: unknown) => {
      logger.error('Authentication service request failed', error instanceof Error ? error : new Error(String(error)));
      return null;
    });

  if (session === null) {
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.SERVICE_UNAVAILABLE)
      .withMessage('Authentication failed')
      .buildAndSend(res);
  }

  if (session.error) {
    logger.error('Authentication service returned an error', session.error);
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.SERVICE_UNAVAILABLE)
      .withMessage('Authentication failed')
      .buildAndSend(res);
  }

  if (!session.data) {
    logger.warn('No session data found');
    return ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').buildAndSend(res);
  }

  const context: RequestContext = {
    user: session.data.user,
    session: session.data.session,
  };
  logger.debug('Request context set', {userId: context.user?.id});

  req.context = context;
  res.locals.context = context;

  next();
}
