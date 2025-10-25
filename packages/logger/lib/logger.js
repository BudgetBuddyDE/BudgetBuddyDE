"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = void 0;
exports.createLogger = createLogger;
exports.formatMessage = formatMessage;
exports.sanitizeLogMeta = sanitizeLogMeta;
exports.splitLogParams = splitLogParams;
exports.printMessage = printMessage;
exports.shouldPublishLog = shouldPublishLog;
const node_util_1 = __importDefault(require("node:util"));
const config_1 = require("./config");
const transport_1 = require("./transport");
const transportManager_1 = require("./transportManager");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["FATAL"] = 0] = "FATAL";
    LogLevel[LogLevel["ERROR"] = 1] = "ERROR";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["INFO"] = 3] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 4] = "DEBUG";
    LogLevel[LogLevel["SILENT"] = 5] = "SILENT";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
const LEVEL_STRINGS = Object.values(LogLevel)
    .filter((level) => typeof level === 'string')
    .map((level) => level.toLowerCase());
const MAX_LEVEL_LENGTH = Math.max(...LEVEL_STRINGS.map((l) => l.length));
function createLogger(options) {
    var _a;
    const state = {
        isEnabled: options.disabled !== true,
        level: (_a = options.level) !== null && _a !== void 0 ? _a : LogLevel.INFO,
    };
    const transportManager = new transportManager_1.TransportManager(options.transports || []);
    const defaultMeta = options.defaultMeta ? sanitizeLogMeta(options.defaultMeta) : undefined;
    // Print warning if no transports are configured for this log-client
    if (transportManager.count === 0) {
        if (!options.supressNoTransportWarning) {
            printMessage(LogLevel.WARN, formatMessage(new Date(), LogLevel.WARN, 'No transports configured. Logs will be sent to the console by default.', options.label));
        }
        transportManager.add(new transport_1.ConsoleTransport({
            label: options.label,
            level: state.level,
            hideMeta: options.hideMeta,
            enabled: state.isEnabled,
            batchSize: 1,
            debounceMs: 0,
        }));
    }
    else {
        // Run option injection using the transport manager for all configured transports
        transportManager.injectOptions({
            enabled: state.isEnabled,
            level: state.level,
            label: options.label,
        });
    }
    function log(level) {
        // biome-ignore lint/suspicious/noExplicitAny: We need to allow any type for the log function parameters
        return (message, ...args) => {
            if (!state.isEnabled || !shouldPublishLog(state.level, level))
                return;
            // Split params/metadata
            const { msg, params, meta } = splitLogParams([message, ...args]);
            // Merge defaultMeta with log-specific meta
            const mergedMeta = defaultMeta || meta ? { ...defaultMeta, ...meta } : undefined;
            // Format message like console.log with util.format
            const formattedText = args.length > 0 ? node_util_1.default.format(msg, ...params) : msg;
            const dateTime = new Date();
            transportManager.addLogToQueue({
                dateTime: dateTime,
                level: level,
                message: formattedText,
                meta: mergedMeta,
            });
        };
    }
    return {
        ...Object.fromEntries(LEVEL_STRINGS.map((level) => [level, log(LogLevel[level.toUpperCase()])])),
        setLogLevel(level, updateTransports = false) {
            state.level = level;
            if (updateTransports) {
                transportManager.setLogLevel(level);
            }
        },
        getLogLevel() {
            return state.level;
        },
        getLogLevelName() {
            return LogLevel[state.level];
        },
        child(childOptions) {
            var _a, _b, _c, _d, _e, _f;
            const childTransports = childOptions.transports || options.transports || [];
            const mergedOptions = {
                label: (_a = childOptions.label) !== null && _a !== void 0 ? _a : options.label,
                disabled: (_b = childOptions.disabled) !== null && _b !== void 0 ? _b : options.disabled,
                hideMeta: (_c = childOptions.hideMeta) !== null && _c !== void 0 ? _c : options.hideMeta,
                level: (_d = childOptions.level) !== null && _d !== void 0 ? _d : state.level,
                transports: childTransports,
                defaultMeta: (_e = childOptions.defaultMeta) !== null && _e !== void 0 ? _e : options.defaultMeta,
                supressNoTransportWarning: (_f = childOptions.supressNoTransportWarning) !== null && _f !== void 0 ? _f : options.supressNoTransportWarning,
            };
            for (const transport of childTransports) {
                transport.configure({
                    label: mergedOptions.label,
                    level: mergedOptions.level,
                    enabled: mergedOptions.disabled !== true,
                });
            }
            return createLogger(mergedOptions);
        },
        getTransports() {
            return transportManager.registeredTransports;
        },
    };
}
/**
 * Pads the log level string to a fixed length for consistent formatting.
 * @param level The log level to pad.
 * @returns The padded log level string.
 */
function getPaddedLevel(level) {
    return LogLevel[level].padEnd(MAX_LEVEL_LENGTH, ' ');
}
/**
 * Formats a log message with the given level, message, and scope.
 * @param dateTime The date and time of the log entry.
 * @param level The log level.
 * @param message The log message.
 * @param label The log label.
 * @returns The formatted log message.
 */
function formatMessage(dateTime, level, message, label) {
    const timestamp = dateTime.toISOString();
    const levelString = getPaddedLevel(level);
    return `${config_1.LOG_COLORS.dim}${timestamp}${config_1.LOG_COLORS.reset} ${config_1.LOG_LEVEL_COLORS[level]}${levelString}${config_1.LOG_COLORS.reset} ${config_1.LOG_COLORS.bright}[${label}]:${config_1.LOG_COLORS.reset} ${message}`;
}
/**
 * Sanitizes metadata to ensure all values are of allowed types.
 * Converts unsupported types to strings.
 * @param rawMeta The raw metadata object
 * @returns Sanitized metadata with only allowed types
 */
// biome-ignore lint/suspicious/noExplicitAny: We need to accept any input type to sanitize it
function sanitizeLogMeta(rawMeta) {
    const sanitized = {};
    for (const [key, value] of Object.entries(rawMeta)) {
        if (!value) {
            sanitized[key] = value;
            continue;
        }
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            sanitized[key] = value;
            continue;
        }
        // Convert unsupported types to strings
        if (typeof value === 'function' || typeof value === 'symbol') {
            // JSON.stringify returns undefined for functions and symbols, so use String() directly
            sanitized[key] = String(value);
        }
        else {
            try {
                sanitized[key] = JSON.stringify(value);
            }
            catch {
                sanitized[key] = String(value);
            }
        }
    }
    return sanitized;
}
/**
 * Splits the log parameters into a message, parameters, and optional metadata.
 * Automatically sanitizes metadata to ensure only allowed types are included.
 * @param args The arguments passed to the log function.
 * @returns An object containing the split log parameters.
 */
// biome-ignore lint/suspicious/noExplicitAny: The arguments can be of any type, so we allow any here.
function splitLogParams(args) {
    let meta;
    if (args.length > 1 &&
        typeof args[args.length - 1] === 'object' &&
        args[args.length - 1] !== null &&
        !Array.isArray(args[args.length - 1])) {
        const rawMeta = args.pop();
        meta = sanitizeLogMeta(rawMeta);
    }
    const [msg, ...params] = args;
    return { msg, params, meta };
}
/**
 * Prints a log message to the console.
 * @param level The log level of the message.
 * @param formattedMessage The formatted log message.
 * @param meta Optional metadata associated with the log message.
 * @param hideMeta Optional flag to hide metadata in the output.
 */
function printMessage(level, formattedMessage, meta, hideMeta) {
    switch (level) {
        case LogLevel.FATAL:
        case LogLevel.ERROR:
            meta && !hideMeta ? console.error(formattedMessage, meta) : console.error(formattedMessage);
            break;
        case LogLevel.WARN:
            meta && !hideMeta ? console.warn(formattedMessage, meta) : console.warn(formattedMessage);
            break;
        // For readability, we can keep INFO and DEBUG
        // case LogLevel.INFO:
        // case LogLevel.DEBUG:
        default:
            meta && !hideMeta ? console.log(formattedMessage, meta) : console.log(formattedMessage);
    }
}
/**
 * Determines whether a log message should be output based on the current logging level.
 *
 * @param {LogLevel} currentLevel - The current minimum log level. Messages below this level will not be logged.
 * @param {LogLevel} logLevel - The log level of the message to evaluate.
 * @returns {boolean} Returns `true` if the message should be logged, or `false` otherwise.
 *
 * If `currentLevel` is `LogLevel.SILENT`, no messages are logged.
 * Otherwise, messages with a level less than or equal to `currentLevel` will be logged.
 *
 * @example
 * shouldPublishLog(LogLevel.INFO, LogLevel.ERROR); // true
 * shouldPublishLog(LogLevel.WARN, LogLevel.INFO);  // false
 * shouldPublishLog(LogLevel.SILENT, LogLevel.DEBUG); // false
 */
function shouldPublishLog(currentLevel, logLevel) {
    if (currentLevel === LogLevel.SILENT)
        return false;
    return logLevel <= currentLevel;
}
