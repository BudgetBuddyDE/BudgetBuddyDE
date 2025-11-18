import type {Response} from 'express';

import {HTTPStatusCode} from './HttpStatusCode';

type BaseProperties<T> = {
  data: T | null;
  message: string | null;
  error?: string | null;
  from?: 'db' | 'cache';
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
 *     .withExpressResponse(res)
 *     .withStatus(HTTPStatusCode.OK)
 *     .withMessage('Hello World')
 *     .withData('Hello World')
 *     .withFrom('db')
 *     .buildAndSend();
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
   * Sets the ExpressJS response object.
   * @param res - The ExpressJS response object.
   * @returns The ApiResponseBuilder instance.
   */
  public withExpressResponse(res: Response): ApiResponseBuilder<T> {
    this.res = res;
    return this;
  }

  /**
   * Sets the status of the API response.
   * @param status - The status code.
   * @returns The ApiResponseBuilder instance.
   */
  public withStatus(status: number | HTTPStatusCode): ApiResponseBuilder<T> {
    this.responseBody.status = status;
    return this;
  }

  /**
   * Sets the message of the API response.
   * @param message - The message.
   * @returns The ApiResponseBuilder instance.
   */
  public withMessage(message: string | null): ApiResponseBuilder<T> {
    this.responseBody.message = message;
    return this;
  }

  /**
   * Sets the error message of the API response.
   * @param error - The error message.
   * @returns The ApiResponseBuilder instance.
   */
  public withError(error: string | null): ApiResponseBuilder<T> {
    this.responseBody.error = error;
    return this;
  }

  /**
   * Sets the data of the API response.
   * @param data - The data.
   * @returns The ApiResponseBuilder instance.
   */
  public withData(data: T | null): ApiResponseBuilder<T> {
    this.responseBody.data = data;
    return this;
  }

  /**
   * Sets the source of the response data.
   * @param from The source of the response data. Must be either "db" or "cache".
   * @returns The ApiResponseBuilder instance.
   */
  public withFrom(from: 'db' | 'cache'): ApiResponseBuilder<T> {
    this.responseBody.from = from;
    return this;
  }

  /**
   * Retrieves the response body of the API.
   *
   * @returns {ApiResponse<T>} The response body of the API.
   */
  public getResponseBody(): ApiResponse<T> {
    return this.responseBody;
  }

  /**
   * Builds the ApiResponse object.
   *
   * @returns The built ApiResponse object.
   */
  public build(): ApiResponse<T> {
    return this.responseBody;
  }

  /**
   * Sends the constructed response using the ExpressJS response object.
   */
  public buildAndSend(): void {
    if (this.res) {
      if (!this.responseBody.from) delete this.responseBody.from;
      if (!this.responseBody.message) delete this.responseBody.message;
      if (!this.responseBody.error) delete this.responseBody.error;
      this.res.status(this.responseBody.status).json(this.build()).end();
    } else {
      throw new Error('ExpressJS response object is not set.');
    }
  }
}
