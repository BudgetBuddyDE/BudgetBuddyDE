import {type NextFunction, type Request, type Response} from 'express';

import {logger} from '../core/logger';
import {ApiResponse} from '../models/ApiResponse';
import {HTTPStatusCode} from '../models/HttpStatusCode';

export function handleError(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('Error occurred: %s', err.name, err);
  return ApiResponse.expressBuilder(res)
    .withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR)
    .withMessage('Internal Server Error')
    .withError(err.message)
    .buildAndSend();
}
