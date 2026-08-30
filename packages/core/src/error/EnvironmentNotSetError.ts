import {CustomError} from './CustomError';

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
