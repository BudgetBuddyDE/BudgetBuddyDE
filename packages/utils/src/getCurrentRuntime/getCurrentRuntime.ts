import 'dotenv/config';

export type Runtime = 'production' | 'development' | 'test';

/**
 * Retrieves the current runtime environment.
 *
 * The runtime environment is determined based on the `NODE_ENV` environment variable.
 * If `NODE_ENV` is not set, it defaults to 'development'.
 *
 * @returns {Runtime} The current runtime environment, which can be 'production', 'development', or 'test'.
 */
export function getCurrentRuntime(): Runtime {
  const envValue = process.env.NODE_ENV;
  if (!envValue) return 'development' as Runtime;

  switch (envValue.toLowerCase()) {
    case 'production':
    case 'test':
    case 'development':
      return envValue as Runtime;
    default:
      return 'development' as Runtime;
  }
}
