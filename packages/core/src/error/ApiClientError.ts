import {CustomError} from './CustomError';

/**
 * Error raised while a consumer communicates with the API.
 *
 * {@link BackendError} specializes this error for unsuccessful HTTP responses.
 */
export class ApiClientError extends CustomError {}
