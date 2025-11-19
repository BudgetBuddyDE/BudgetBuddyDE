import { Request, Response, NextFunction } from 'express';
import { BuildSchema } from 'drizzle-zod';
import { ZodError, ZodSchema } from 'zod';
import { ApiResponse, HTTPStatusCode } from '../models';
import { requestLogger } from './log.middleware';

type Schema = ZodSchema | BuildSchema<any, any, any, any>;

/**
 * @author https://dev.to/osalumense/validating-request-data-in-expressjs-using-zod-a-comprehensive-guide-3a0j
 */

export function validateRequestBody<T extends Schema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      requestLogger.debug('Validating request body', {
        requestId: req.context.requestId,
        contentType: req.headers['content-type'],
        body: req.body,
      });

      const { success, error } = schema.safeParse(req.body);
      if (!success) {
        requestLogger.error('Request body validation failed', {
          requestId: req.context.requestId,
          errors: error,
        });
        throw error;
      }

      requestLogger.debug('Request body validated successfully', {
        requestId: req.context.requestId,
        body: req.body,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue: any) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
        }));
        ApiResponse.builder<typeof errorMessages>()
          .withStatus(HTTPStatusCode.BAD_REQUEST)
          .withMessage('Invalid request body')
          .withData(errorMessages)
          .buildAndSend(res);
      } else {
        ApiResponse.builder()
          .fromError(error instanceof Error ? error : new Error(String(error)))
          .buildAndSend(res);
      }
    }
  };
}
