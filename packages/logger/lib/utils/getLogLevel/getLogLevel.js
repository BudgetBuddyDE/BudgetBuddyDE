"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogLevel = getLogLevel;
const logger_1 = require("../../logger");
/**
 * Parses a log level string into a LogLevel enum.
 * @param level - The log level as a string.
 * @throws Will throw an error if the log level is unknown.
 * @returns The corresponding LogLevel enum value.
 */
function getLogLevel(level) {
    switch (level.toLowerCase()) {
        case 'fatal':
            return logger_1.LogLevel.FATAL;
        case 'error':
            return logger_1.LogLevel.ERROR;
        case 'warn':
            return logger_1.LogLevel.WARN;
        case 'info':
            return logger_1.LogLevel.INFO;
        case 'debug':
            return logger_1.LogLevel.DEBUG;
        case 'silent':
            return logger_1.LogLevel.SILENT;
        default:
            throw new Error(`Unknown log level: ${level}`);
    }
}
