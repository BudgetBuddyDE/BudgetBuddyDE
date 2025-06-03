import {type NextFunction, type Request, type Response} from 'express';

import {ApiResponse, HTTPStatusCode} from '../models';
import {requestLogger} from './log.middleware';

export function handleError(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  requestLogger.error('Error occurred: %s', err.name, err);
  return ApiResponse.expressBuilder(res)
    .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
    .withMessage('Internal Server Error')
    .withError(err.message)
    .buildAndSend();
}
