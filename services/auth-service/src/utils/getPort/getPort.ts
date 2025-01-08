import 'dotenv/config';

/**
 * Retrieves the port number from the environment variable or defaults to 8080.
 *
 * @returns The port number as a number.
 */
export function getPort(): number {
  const portEnv = parseInt(process.env.PORT as string, 10);
  return isNaN(portEnv) ? 8080 : portEnv;
}
