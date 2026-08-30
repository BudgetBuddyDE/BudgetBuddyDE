import {EnvironmentNotSetError} from './error';

/**
 * Provides access to a required process environment variable.
 *
 * {@link get} returns the value exactly as it appears in `process.env`. It throws
 * {@link EnvironmentNotSetError} only when the variable is `undefined`.
 */
export class EnvironmentVariable {
  constructor(public readonly name: string) {}

  /** Returns the configured environment value or throws {@link EnvironmentNotSetError}. */
  get(): string {
    const value = process.env[this.name];

    if (value === undefined) {
      throw new EnvironmentNotSetError(this.name);
    }

    return value;
  }
}
