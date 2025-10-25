"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidLogLevel = isValidLogLevel;
const logger_1 = require("../../logger");
/**
 * Checks if a string is a valid log level.
 * @param str - The string to check.
 * @returns True if the string is a valid log level, false otherwise.
 */
function isValidLogLevel(str) {
    return Object.keys(logger_1.LogLevel)
        .filter(key => Number.isNaN(Number(key)))
        .includes(str.toUpperCase());
}
