import { ELogLevel, type LogLevel } from "../../types";

/**
 *
 * @example
 * ```typescript
 * const logLevel = getLogLevel(process.env.LOG_LEVEL);
 * ```
 */
export function getLogLevel(logLevel: string | undefined): LogLevel {
	if (!logLevel) return "info";

	const level = ELogLevel[logLevel.toUpperCase() as keyof typeof ELogLevel];
	return level ? (level as LogLevel) : "info";
}
