import {ApiResponse, HTTPStatusCode} from '@budgetbuddyde/types';
import type {NextFunction, Request, Response} from 'express';

import {logger} from '../logger';
import {AuthService} from '../services';
import {ELogCategory} from './log.middleware';

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
  const requestPath = req.path;
  if (['/status', '/'].some(path => path === requestPath)) return next();

  const authHeader = req.header('Authorization');
  const userId = req.header('X-User-ID');
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res
      .status(HTTPStatusCode.Unauthorized)
      .json(
        ApiResponse.builder().withStatus(HTTPStatusCode.Unauthorized).withMessage('No Bearer token provided').build(),
      )
      .end();
  } else if (!userId) {
    return res
      .status(HTTPStatusCode.Unauthorized)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.Unauthorized).withMessage('No user ID provided').build())
      .end();
  }
  const bearerTokenSecret = process.env.BEARER_TOKEN_SECRET as string;
  const bearerValue = authHeader.split('Bearer')[1].trimStart();
  if (bearerTokenSecret === bearerValue) {
    logger.info('Bearer token is the secret, skipping auth check!');
    const [user, err] = await AuthService.getUser(userId);
    if (err) {
      logger.warn(err.message, {
        path: requestPath,
        name: err.name,
        message: err.message,
        stack: err.stack,
        category: ELogCategory.AUTHENTIFICATION,
        header: {authorization: req.headers.authorization},
      });
    }
    req.user = user;
    return next();
  }

  const [user, err] = await AuthService.verifyToken(bearerValue, userId);
  if (err) {
    logger.warn(err.message, {
      path: requestPath,
      name: err.name,
      message: err.message,
      stack: err.stack,
      category: ELogCategory.AUTHENTIFICATION,
      header: {authorization: req.headers.authorization},
    });
    return res
      .status(HTTPStatusCode.Unauthorized)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.Unauthorized).withMessage(err.message).build())
      .end();
  } else if (!user) {
    const msg = 'No user found';
    logger.warn(msg, {
      category: ELogCategory.AUTHENTIFICATION,
      header: {authorization: req.headers.authorization},
    });
    return res
      .status(HTTPStatusCode.NotFound)
      .json(ApiResponse.builder().withStatus(HTTPStatusCode.NotFound).withMessage(msg).build())
      .end();
  }

  req.user = user;

  next();
}
