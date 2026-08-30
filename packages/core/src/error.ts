/**
 * Base class for all BudgetBuddy-specific errors.
 *
 * Child classes such as {@link ApiClientError}, {@link CacheError}, and
 * {@link EnvironmentNotSetError} retain a reliable prototype chain and stack trace.
 */
export class CustomError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;

    const errorConstructor = Error as ErrorConstructor & {
      captureStackTrace?: (targetObject: object, constructorOpt?: typeof CustomError) => void;
    };
    errorConstructor.captureStackTrace?.(this, new.target);
  }
}

/**
 * Error raised while a consumer communicates with the API.
 *
 * {@link BackendError} specializes this error for unsuccessful HTTP responses.
 */
export class ApiClientError extends CustomError {}

/**
 * Error raised when the backend returns an unsuccessful HTTP response.
 *
 * This is an {@link ApiClientError}, and therefore also a {@link CustomError}.
 */
export class BackendError extends ApiClientError {
  public readonly statusCode: number;
  public readonly backendResponseText: string;

  constructor(statusCode: number, backendResponseText: string) {
    super(backendResponseText);
    this.statusCode = statusCode;
    this.backendResponseText = backendResponseText;
  }

  /** Returns a descriptive message containing the HTTP status and backend response. */
  getMessage(): string {
    return `Backend failed the request with status ${this.statusCode}: ${this.backendResponseText}`;
  }
}

/**
 * Error raised when a cache operation cannot be completed.
 *
 * This is a {@link CustomError} for cache infrastructure failures.
 */
export class CacheError extends CustomError {}

/**
 * Error raised when a database operation cannot be completed.
 *
 * This is a {@link CustomError} for database infrastructure failures.
 */
export class DatabaseError extends CustomError {}

/**
 * Error raised when a required environment variable is absent.
 *
 * {@link EnvironmentVariable} creates this error when its value is `undefined`.
 */
export class EnvironmentNotSetError extends CustomError {
  public readonly variableName: string;

  constructor(variableName: string) {
    super(`Environment variable ${variableName} is not set`);
    this.variableName = variableName;
  }
}
