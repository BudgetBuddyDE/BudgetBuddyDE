import { type TConfig } from 'config';

/**
 * Retrieves the current runtime environment.
 * @returns The current runtime environment.
 */
export function getCurrentRuntimeEnvironment(): TConfig['environment'] {
  const envValue = process.env.ENV as TConfig['environment'];
  switch (envValue) {
    case 'production':
    case 'test':
    case 'development':
      return envValue;
    default:
      return 'development';
  }
}
