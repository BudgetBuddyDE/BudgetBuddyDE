import "dotenv/config";

/**
 * Retrieves a list of trusted origins from the environment variables.
 *
 * @param {string} [envName="TRUSTED_ORIGINS"] - The name of the environment variable that contains the trusted origins.
 * @returns {string[]} An array of trusted origins. If the environment variable is not set, an empty array is returned.
 */
export function getTrustedOrigins(envName = "TRUSTED_ORIGINS"): string[] {
	const trustedOrigins = process.env[envName];
	if (!trustedOrigins) return [];
	return trustedOrigins.split(",");
}
