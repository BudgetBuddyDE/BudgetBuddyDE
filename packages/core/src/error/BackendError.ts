import {ApiClientError} from './ApiClientError';

/**
 * Error raised when the backend returns an unsuccessful HTTP response.
 *
 * This is an {@link ApiClientError}, and therefore also a {@link CustomError}.
 */
export class BackendError extends ApiClientError {
  public readonly statusCode: number;
  public readonly backendResponseText: string;

  constructor(statusCode: number, backendResponseText: string, options?: {cause?: unknown}) {
    super(backendResponseText, options);
    this.statusCode = statusCode;
    this.backendResponseText = backendResponseText;
  }

  /** Returns a descriptive message containing the HTTP status and backend response. */
  getMessage(): string {
    return `Backend failed the request with status ${this.statusCode}: ${this.backendResponseText}`;
  }
}
