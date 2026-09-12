import {ApiClientError} from '@budgetbuddyde/core/error/ApiClientError';

export {ApiClientError} from '@budgetbuddyde/core/error/ApiClientError';
export {BackendError} from '@budgetbuddyde/core/error/BackendError';

/**
 * Error class representing a response that is not in JSON format.
 */
export class ResponseNotJsonError extends ApiClientError {
  constructor() {
    super('Response is not JSON');
  }
}
