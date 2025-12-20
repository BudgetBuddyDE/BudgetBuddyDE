import { getCurrentRuntime } from "../getCurrentRuntime";

/**
 * Determines if the current runtime environment is production.
 *
 * This function checks the current runtime environment by calling
 * `getCurrentRuntime` and compares it to the string 'production'.
 *
 * @returns {boolean} `true` if the current runtime environment is production, otherwise `false`.
 */
export function isRunningInProd(): boolean {
	return getCurrentRuntime() === "production";
}
