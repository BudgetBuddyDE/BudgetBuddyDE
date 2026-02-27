import type {NextFunction, Request, Response} from 'express';
import {authClient, logger} from '../lib';
import {ApiResponse, HTTPStatusCode} from '../models';
import type {RequestContext} from '../types';

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
  const {data: sessionData, error} = await authClient.getSession({
    fetchOptions: {
      headers: headers,
    },
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
  };

  req.context = context;
  res.locals.context = context;

  logger.debug('Request context set', {requestId: req.requestId, userId: req.context.user?.id});

  next();
}
