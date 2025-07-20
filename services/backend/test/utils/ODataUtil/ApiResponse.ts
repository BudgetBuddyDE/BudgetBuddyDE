/**
 * Represents an API response.
 * @template T - The type of the data in the response.
 *
 * Usage
 * ```typescript
 * const response: ApiResponse<string> = ApiResponse
 *   .builder<string>()
 *   .withStatus(200)
 *   .withData('Hello World')
 *   .build();
 * ```
 */
export class ApiResponse<T> {
  public status: number = 200;
  public data: T | null = null;
  private constructor() {}

  /**
   * Creates a new instance of ApiResponseBuilder.
   * @returns An instance of ApiResponseBuilder.
   */
  public static builder<T>(): ApiResponseBuilder<T> {
    return new ApiResponseBuilder<T>();
  }
}

/**
 * Builder class for ApiResponse.
 * @template T - The type of the data in the response.
 */
export class ApiResponseBuilder<T> {
  // @ts-expect-error can be private, because it can be accessed via the build method
  private response = new ApiResponse<T>();

  /**
   * Sets the status of the API response.
   * @param status - The status code.
   * @returns The ApiResponseBuilder instance.
   */
  public withStatus(status: number): ApiResponseBuilder<T> {
    this.response.status = status;
    return this;
  }

  /**
   * Sets the data of the API response.
   * @param data - The data.
   * @returns The ApiResponseBuilder instance.
   */
  public withData(data: T | null): ApiResponseBuilder<T> {
    this.response.data = data;
    return this;
  }

  /**
   * Builds the API response.
   * @returns The built ApiResponse instance.
   */
  public build(): ApiResponse<T> {
    return this.response;
  }
}
