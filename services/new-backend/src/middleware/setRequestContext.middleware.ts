import {randomUUID} from 'node:crypto';
import type {NextFunction, Request, Response} from 'express';
import {config} from '../config';
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
  const requestId = headers.has(config.requestIdHeaderName)
    ? (headers.get(config.requestIdHeaderName) ?? randomUUID())
    : randomUUID();
  res.setHeader(config.requestIdHeaderName, requestId); // set request ID in response
  headers.set(config.requestIdHeaderName, requestId); // ensure request ID is included in headers sent to auth service
  const {data: sessionData, error} = await authClient.getSession({
    fetchOptions: {
      headers: headers,
    },
  });

  if (error) {
    logger.error('Error retrieving session', {requestId, ...error});
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
      .withMessage(error.message || 'Failed to authenticate request')
      .buildAndSend(res);
  }

  if (!sessionData) {
    logger.error('No session data found', {requestId});
    return ApiResponse.builder()
      .withStatus(HTTPStatusCode.UNPROCESSABLE_ENTITY)
      .withMessage('No session data found')
      .buildAndSend(res);
  }

  const context: RequestContext = {
    requestId: requestId,
    user: sessionData.user,
    session: sessionData.session,
  };

  req.context = context;
  req.requestId = context.requestId;
  res.locals.context = context;

  next();
}
