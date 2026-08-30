import {ApiClientError} from '@budgetbuddyde/core';

export {
  ApiClientError,
  BackendError,
  CacheError,
  CustomError,
  DatabaseError,
  EnvironmentNotSetError,
} from '@budgetbuddyde/core';

/**
 * @deprecated Use {@link ApiClientError} instead.
 */
export {ApiClientError as ApiError} from '@budgetbuddyde/core';

/**
 * Error class representing a response that is not in JSON format.
 */
export class ResponseNotJsonError extends ApiClientError {
  constructor() {
    super('Response is not JSON');
  }
}
