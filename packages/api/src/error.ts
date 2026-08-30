import {ApiClientError} from '@budgetbuddyde/core/error/ApiClientError';

export {ApiClientError} from '@budgetbuddyde/core/error/ApiClientError';
export {BackendError} from '@budgetbuddyde/core/error/BackendError';
export {CacheError} from '@budgetbuddyde/core/error/CacheError';
export {CustomError} from '@budgetbuddyde/core/error/CustomError';
export {DatabaseError} from '@budgetbuddyde/core/error/DatabaseError';
export {EnvironmentNotSetError} from '@budgetbuddyde/core/error/EnvironmentNotSetError';

/**
 * @deprecated Use {@link ApiClientError} instead.
 */
export {ApiClientError as ApiError} from '@budgetbuddyde/core/error/ApiClientError';

/**
 * Error class representing a response that is not in JSON format.
 */
export class ResponseNotJsonError extends ApiClientError {
  constructor() {
    super('Response is not JSON');
  }
}
