import 'dotenv/config';

/**
 * Checks if the CSRF check should be disabled based on an environment variable.
 *
 * @returns {boolean} - Returns `true` if the CSRF check is disabled, otherwise `false`.
 */
export function isCSRFCheckDisabled(): boolean {
  return process.env.DISABLE_CSRF_CHECK === 'true';
}
