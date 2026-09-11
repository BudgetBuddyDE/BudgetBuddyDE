/**
 * Base class for all BudgetBuddy-specific errors.
 *
 * Child classes such as {@link ApiClientError}, {@link CacheError}, and
 * {@link EnvironmentNotSetError} retain a reliable prototype chain and stack trace.
 */
export class CustomError extends Error {
  public readonly cause: unknown;

  constructor(message: string, options?: {cause?: unknown}) {
    super(message);
    this.name = new.target.name;
    this.cause = options?.cause;
  }
}
