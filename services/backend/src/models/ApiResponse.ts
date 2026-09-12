import type {Response} from 'express';
import {ConflictError, NotFoundError} from './errors';
import {HTTPStatusCode} from './HttpStatusCode';
import {logger} from '../lib/logger';

type BaseProperties<T> = {
  totalCount?: number;
  data: T | null;
  message: string | null;
  error?: string | null;
  from?: 'db' | 'cache' | 'external';
};

/**
 * Represents the response from an API.
 * @template T - The type of data in the response.
 */
export type TApiResponse<T> = (BaseProperties<T> & {
  status: 200 | HTTPStatusCode.OK;
}) &
  (BaseProperties<T> & {
    status: number | HTTPStatusCode;
  });

/**
 * Represents an API response.
 * @template T - The type of the data in the response.
 *
 * Usage
 * ```typescript
 * app.get('/test', (req, res) => {
 *   ApiResponse.builder<string>()
 *     .withStatus(HTTPStatusCode.OK)
 *     .withMessage('Hello World')
 *     .withData('Hello World')
 *     .withFrom('db')
 *     .buildAndSend(res);
 * });
 *
 * // or
 *
 * app.get('/another-test', (req, res) => {
 *   ApiResponse.expressBuilder<string>(res)
 *     .withStatus(HTTPStatusCode.OK)
 *     .withMessage('Hello World')
 *     .withData('Hello World')
 *     .withFrom('db')
 *     .buildAndSend();
 * });
 * ```
 */
export class ApiResponse<T> {
  public status: number | HTTPStatusCode = HTTPStatusCode.OK;
  public message: string | null = null;
  public totalCount: number | undefined = undefined;
  public data: T | null = null;
  public error: string | null = null;
  public from: 'db' | 'cache' | null = null;
  private constructor() {}

  /**
   * Creates a new instance of ApiResponseBuilder.
   * @returns An instance of ApiResponseBuilder.
   */
  public static builder<T>(): ApiResponseBuilder<T> {
    return new ApiResponseBuilder<T>();
  }

  public static expressBuilder<T>(res: Response): ApiResponseBuilder<T> {
    return new ApiResponseBuilder<T>(res);
  }
}

/**
 * Builder class for ApiResponse.
 * @template T - The type of the data in the response.
 */
export class ApiResponseBuilder<T> {
  // @ts-expect-error can be private, because it can be accessed via the build method
  private responseBody = new ApiResponse<T>();
  private res: Response | null = null;

  public constructor(res?: Response) {
    this.res = res || null;
  }

  /**
   * Sets the status of the API response.
   * @param status - The status code.
   * @returns The ApiResponseBuilder instance.
   */
  public withStatus(status: HTTPStatusCode | number): ApiResponseBuilder<T> {
    this.responseBody.status = status;
    return this;
  }

  /**
   * Sets the message of the API response.
   * @param message - The message.
   * @returns The ApiResponseBuilder instance.
   */
  public withMessage(message: TApiResponse<T>['message']): ApiResponseBuilder<T> {
    this.responseBody.message = message;
    return this;
  }

  /**
   * Sets the error message of the API response.
   * @param error - The error message.
   * @returns The ApiResponseBuilder instance.
   */
  public withError(error: TApiResponse<T>['error']): ApiResponseBuilder<T> {
    this.responseBody.error = error;
    return this;
  }

  /**
   * Sets the data of the API response.
   * @param data - The data.
   * @returns The ApiResponseBuilder instance.
   */
  public withData(data: TApiResponse<T>['data']): ApiResponseBuilder<T> {
    this.responseBody.data = data;
    return this;
  }

  /**
   * Sets the total count of records in the database
   * @param totalCount - The total count of records.
   * @returns The ApiResponseBuilder instance.
   */
  public withTotalCount(totalCount: TApiResponse<T>['totalCount']): ApiResponseBuilder<T> {
    this.responseBody.totalCount = typeof totalCount === 'number' ? totalCount : Number(totalCount);
    return this;
  }

  /**
   * Sets the source of the response data.
   * @param from The source of the response data. Must be either "db" or "cache".
   * @returns The ApiResponseBuilder instance.
   */
  public withFrom(from: TApiResponse<T>['from']): ApiResponseBuilder<T> {
    this.responseBody.from = from;
    return this;
  }

  /**
   * Builds the ApiResponse object.
   *
   * @returns The built ApiResponse object.
   */
  public build(): ApiResponse<T> {
    return this.responseBody;
  }

  public fromError(error: Error): ApiResponseBuilder<T> {
    logger.error('Request failed', error);

    if (error instanceof NotFoundError) {
      return this.withStatus(HTTPStatusCode.NOT_FOUND).withMessage(error.message);
    }
    if (error instanceof ConflictError || isUniqueViolation(error)) {
      return this.withStatus(HTTPStatusCode.CONFLICT).withMessage(
        error instanceof ConflictError ? error.message : 'Resource already exists',
      );
    }

    this.withStatus(HTTPStatusCode.INTERNAL_SERVER_ERROR);
    this.withMessage('Internal Server Error');
    return this;
  }

  /**
   * Sends the constructed response using the ExpressJS response object.
   */
  public buildAndSend(response?: Response): void {
    if (!this.res && !response) {
      throw new Error('ExpressJS response object is not set.');
    }

    this.res = (this.res || response) as Response;
    this.responseObjIsSet(this.res);

    if (!this.responseBody.from) delete this.responseBody.from;
    if (!this.responseBody.message) delete this.responseBody.message;
    if (!this.responseBody.error) delete this.responseBody.error;
    this.res.status(this.responseBody.status).json(this.build()).end();
  }

  private responseObjIsSet(response: Response | undefined | null): asserts response is Response {
    if (!this.res && !response) {
      throw new Error('ExpressJS response object is not set.');
    }
  }
}

/** Detects PostgreSQL unique-constraint violations, including wrapped causes. */
function isUniqueViolation(error: Error): boolean {
  const code = (error as {code?: unknown}).code ?? (error.cause as {code?: unknown} | undefined)?.code;
  return code === '23505';
}
