"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleTransport = void 0;
const logger_1 = require("../../logger");
const transport_1 = require("../transport");
/**
 * Console transport that outputs logs to the console
 */
class ConsoleTransport extends transport_1.Transport {
    constructor(options) {
        var _a, _b, _c;
        super({
            label: options.label,
            batchSize: (_a = options.batchSize) !== null && _a !== void 0 ? _a : 1,
            debounceMs: (_b = options.debounceMs) !== null && _b !== void 0 ? _b : 0,
            level: options.level,
            enabled: options.enabled,
        });
        this.hideMeta = (_c = options.hideMeta) !== null && _c !== void 0 ? _c : false;
        this.customFormatFunc = options.format;
    }
    sendBatch(logs) {
        for (const log of logs) {
            (0, logger_1.printMessage)(log.level, this.customFormatFunc
                ? this.customFormatFunc(log.dateTime, log.level, this.options.label, log.message, log.meta)
                : (0, logger_1.formatMessage)(log.dateTime, log.level, log.message, this.options.label), log.meta, this.hideMeta);
        }
    }
}
exports.ConsoleTransport = ConsoleTransport;
