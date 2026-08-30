import {CustomError} from './CustomError';

/**
 * Error raised when a database operation cannot be completed.
 *
 * This is a {@link CustomError} for database infrastructure failures.
 */
export class DatabaseError extends CustomError {}
