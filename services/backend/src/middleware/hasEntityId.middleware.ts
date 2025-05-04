import {type NextFunction, type Request, type Response} from 'express';

import {ApiResponse} from '../models/ApiResponse';

/**
 * Express middleware to ensure a valid 'id' parameter exists in the request parameters.
 *
 * This middleware verifies that:
 * - The 'id' parameter exists in the request.
 * - The 'id' parameter can be correctly parsed as a number.
 *
 * If the 'id' is missing, it sends a 400 status with an error message indicating that the parameter is required.
 * If the 'id' is not a valid number, it sends a 400 status with an error message indicating an invalid format.
 *
 * Upon successful validation, the middleware asserts that the request parameters include an 'id' of type string and
 * proceeds to the next middleware.
 *
 * @param req - The Express request object containing the parameters. After validation, it is asserted to have an 'id' of type string.
 * @param res - The Express response object used to send error responses.
 * @param next - The next middleware function in the stack to be called if validation succeeds.
 *
 * @remarks
 * Uses TypeScript's assertion function signature to refine the type of the request parameters.
 */
export function hasEntityId(req: Request, res: Response, next: NextFunction): asserts req is Request<{id: string}> {
  const {id} = req.params;
  if (!id) {
    return ApiResponse.builder()
      .withStatus(400)
      .withMessage('Parameter ID is required')
      .withExpressResponse(res)
      .buildAndSend();
  }

  const parsedId = Number(id);
  if (isNaN(parsedId)) {
    return ApiResponse.builder()
      .withStatus(400)
      .withMessage('Invalid ID format')
      .withExpressResponse(res)
      .buildAndSend();
  }
  next();
}
