import { format } from "winston";

export function padLevel(whitespaceCount: number) {
	return format((info) => {
		info.level = info.level.padEnd(whitespaceCount, " ");
		info.level = info.level.toUpperCase();
		return info;
	})();
}
