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
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
    this.cause = options?.cause;

    const errorConstructor = Error as ErrorConstructor & {
      captureStackTrace?: (targetObject: object, constructorOpt?: typeof CustomError) => void;
    };
    errorConstructor.captureStackTrace?.(this, new.target);
  }
}
