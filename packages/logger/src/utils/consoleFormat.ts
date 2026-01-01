import { format } from "winston";

export function buildConsoleFormat(fallbackLabel: string, hideMeta = false) {
	return format.printf((info) => {
		const { timestamp, level, message, label, ...meta } = info;
		const gray = "\x1b[90m";
		const reset = "\x1b[0m";

		const labelPart = label ? `[${label}]` : `[${fallbackLabel}]`;
		const metaPart =
			!hideMeta && Object.keys(meta).length > 0 ? JSON.stringify(meta) : "";
		return `${gray}${timestamp}${reset} ${level} ${labelPart} ${message} ${metaPart}`;
	});
}
