import 'dotenv/config';

/**
 * Retrieves the list of trusted origins from the environment variable `TRUSTED_ORIGINS`.
 *
 * @returns {string[]} An array of trusted origins. If the environment variable is not set, returns an empty array.
 */
export function getTrustedOrigins(): string[] {
  const trustedOrigins = process.env.TRUSTED_ORIGINS;
  if (!trustedOrigins) {
    return [];
  }

  return trustedOrigins.split(',');
}
