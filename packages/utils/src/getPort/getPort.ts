import 'dotenv/config';

/**
 * Retrieves the port number from the environment variables or returns a fallback port.
 *
 * This function attempts to read the port number from the environment variables.
 * If the environment variable `PORT` is set and is a valid number, it returns that.
 * Otherwise, it returns the provided `fallbackPort`.
 *
 * @param {number} [fallbackPort=3000] - The port to use if no valid port number is found in the environment variables.
 * @returns {number} - The port number from the environment variables or the `fallbackPort`.
 *
 * @example
 * ```typescript
 * // Example 1: PORT is set in the environment variables
 * process.env.PORT = '8080';
 * const port = getPort(); // port will be 8080
 *
 * // Example 2: PORT is not set or invalid
 * delete process.env.PORT;
 * const port = getPort(3000); // port will be 3000
 * ```
 */
export function getPort(fallbackPort = 3000): number {
  const envPort = process.env.PORT;
  return envPort && !isNaN(parseInt(envPort)) ? parseInt(envPort) : fallbackPort;
}
