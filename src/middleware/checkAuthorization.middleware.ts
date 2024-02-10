import type {NextFunction, Request, Response} from 'express';
import {z} from 'zod';
import {ApiResponse, HTTPStatusCode} from '@budgetbuddyde/types';
import {AuthService} from '../services';
import {ELogCategory} from './log.middleware';
import {logger} from '../core';

export const ZUuid = z.string().uuid();

/**
 * Middleware function to check the authorization header in the request.
 * If the authorization header is missing or invalid, it returns a 401 Unauthorized response.
 * Otherwise, it calls the next middleware function.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export async function checkAuthorizationHeader(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const requestPath = req.path;

  if (requestPath === '/status' || requestPath === '/') {
    return next();
  }

  if (!authHeader) {
    return res
      .status(HTTPStatusCode.Unauthorized)
      .json(
        ApiResponse.builder().withStatus(HTTPStatusCode.Unauthorized).withMessage('No Bearer token provided').build(),
      )
      .end();
  }

  const [user, err] = await AuthService.validateAuthHeader(authHeader as string);
  if (err) {
    logger.error('Error validating auth header', {
      stack: err.stack,
      error: err.message,
      header: {authorization: authHeader},
    });
    return res
      .status(HTTPStatusCode.Unauthorized)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.Unauthorized)
          .withMessage('Invalid Bearer token provided by header')
          .build(),
      )
      .end();
  } else if (!user) {
    logger.warn('No user found', {
      category: ELogCategory.AUTHENTIFICATION,
      header: {authorization: req.headers.authorization},
    });
    return res
      .status(HTTPStatusCode.Unauthorized)
      .json(
        ApiResponse.builder()
          .withStatus(HTTPStatusCode.Unauthorized)
          .withMessage('No user found for Bearer token provided by header')
          .build(),
      )
      .end();
  }

  req.user = user;

  next();
}
