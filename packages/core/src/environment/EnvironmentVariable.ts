import {EnvironmentNotSetError} from '../error/EnvironmentNotSetError';

/**
 * Provides access to a process environment variable.
 *
 * Accessors return the value exactly as it appears in `process.env`. {@link get}
 * throws {@link EnvironmentNotSetError} when the variable is `undefined`, while
 * {@link getOptional} returns `undefined`.
 */
export class EnvironmentVariable {
  constructor(public readonly name: string) {}

  /** Returns the configured environment value or throws {@link EnvironmentNotSetError}. */
  get(): string {
    const value = this.getOptional();

    if (value === undefined) {
      throw new EnvironmentNotSetError(this.name);
    }

    return value;
  }

  /** Returns the configured environment value or `undefined` when it is not set. */
  getOptional(): string | undefined {
    return process.env[this.name];
  }
}
