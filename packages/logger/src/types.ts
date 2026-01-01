import type { LevelConfig } from "./config";

export enum ELogLevel {
	SILENT = "silent",
	DEBUG = "debug",
	INFO = "info",
	WARN = "warn",
	ERROR = "error",
	CRIT = "crit",
}

export type LogLevel = keyof typeof LevelConfig.levels;
