import type {NextFunction, Request, Response} from 'express';
import {authClient, logger as mainLogger} from '../lib';
import {ApiResponse, HTTPStatusCode} from '../models';
import type {RequestContext} from '../types';

const logger = mainLogger.child({label: 'auth', middleware: 'setRequestContext'});

export async function setRequestContext(req: Request, res: Response, next: NextFunction) {
  const headers = new Headers(
    Object.entries(req.headers).reduce(
      (acc, [key, value]) => {
        if (Array.isArray(value)) {
          acc[key] = value.join(', ');
        } else if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>,
    ),
  );

  logger.debug('Retrieving session data for request', {requestId: req.requestId});
  const {data: sessionData, error} = await authClient.getSession({
    fetchOptions: {
      headers: headers,
    },
  });

  logger.debug('Session data retrieved', {
    requestId: req.requestId,
    userId: sessionData?.user?.id,
    sessionId: sessionData?.session?.id,
    error,
  });

  if (error) {
    logger.error('Error retrieving session', error);
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
      .withMessage(error.message || 'Failed to authenticate request')
      .buildAndSend(res);
  }

  if (!sessionData) {
    logger.warn('No session data found');
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.UNAUTHORIZED)
      .withMessage('No session data found')
      .buildAndSend(res);
  }

  const context: RequestContext = {
    user: sessionData.user,
    session: sessionData.session,
    permissions: {},
  };
  logger.debug('Session data retrieved', {requestId: req.requestId, userId: context.user?.id});

  req.context = context;
  res.locals.context = context;

  logger.debug('Request context set', {requestId: req.requestId, userId: req.context.user?.id});

  next();
}
