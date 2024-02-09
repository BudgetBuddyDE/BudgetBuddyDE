import { getCurrentRuntimeEnvironment } from './getCurrentRuntimeEnvironment.util';

/**
 * Checks if the application is running in production mode.
 * @returns A boolean indicating whether the application is running in production mode.
 */
export function isRunningInProduction(): boolean {
  return getCurrentRuntimeEnvironment() === 'production';
}
