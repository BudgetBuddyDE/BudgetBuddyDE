import {CustomError} from './CustomError';

/**
 * Error raised when a cache operation cannot be completed.
 *
 * This is a {@link CustomError} for cache infrastructure failures.
 */
export class CacheError extends CustomError {}
