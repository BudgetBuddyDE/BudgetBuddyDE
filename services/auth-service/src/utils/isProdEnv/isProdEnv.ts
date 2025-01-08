import 'dotenv/config';

/**
 * Determines if the current environment is a production environment.
 *
 * This function checks the `NODE_ENV` and `PROD` environment variables to
 * determine if the application is running in production mode.
 *
 * @returns {boolean} `true` if the environment is production, otherwise `false`.
 */
export function isProdEnv(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.PROD === 'true';
}
