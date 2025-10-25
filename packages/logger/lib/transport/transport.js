"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transport = void 0;
const lodash_debounce_1 = __importDefault(require("lodash.debounce"));
const logger_1 = require("../logger");
/**
 * Abstract base class for log transports
 */
class Transport {
    constructor(options) {
        var _a, _b, _c;
        this.logQueue = [];
        this.transportOptions = {
            batchSize: Math.max(1, (_a = options.batchSize) !== null && _a !== void 0 ? _a : 10), // Ensure positive batch size
            debounceMs: Math.max(0, (_b = options.debounceMs) !== null && _b !== void 0 ? _b : 300), // Ensure positive debounce time
            level: options.level,
            enabled: options.enabled,
            label: (_c = options.label) !== null && _c !== void 0 ? _c : '', // Ensure label is always set. When empty an label will be injected by the transport manager
        };
        // Initialize debounced flush function
        this.debouncedFlush = (0, lodash_debounce_1.default)(() => {
            this.performFlush();
        }, this.transportOptions.debounceMs);
    }
    get optionsWithoutAssertion() {
        return this.transportOptions;
    }
    get options() {
        this.assertOptionIsSet('level');
        this.assertOptionIsSet('enabled');
        return this.transportOptions;
    }
    setLabel(label) {
        this.transportOptions.label = label;
    }
    setLogLevel(level) {
        this.transportOptions.level = level;
    }
    /**
     * Adds a log entry to the transport queue
     */
    addLogToQueue(entry) {
        this.assertOptionIsSet('level');
        if (!this.transportOptions.enabled) {
            return;
        }
        // Check if log level meets minimum requirement
        if (!(0, logger_1.shouldPublishLog)(this.transportOptions.level, entry.level)) {
            return;
        }
        this.logQueue.push(entry);
        // Send immediately if batch size is reached
        if (this.logQueue.length >= this.transportOptions.batchSize) {
            this.debouncedFlush.cancel(); // Cancel any pending debounced flush
            this.performFlush();
            return;
        }
        // Otherwise, schedule a debounced flush
        this.debouncedFlush();
    }
    /**
     * Internal method that performs the actual flush operation
     */
    performFlush() {
        if (this.logQueue.length === 0) {
            return;
        }
        const logsToSend = [...this.logQueue];
        this.logQueue = [];
        try {
            const result = this.sendBatch(logsToSend);
            // Handle async transports
            if (result instanceof Promise) {
                result.catch((error) => {
                    console.error('Transport failed to send batch:', error);
                    // Re-queue failed logs
                    this.logQueue.unshift(...logsToSend);
                });
            }
        }
        catch (error) {
            console.error('Transport failed to send batch:', error);
            // Re-queue failed logs on sync error as well
            this.logQueue.unshift(...logsToSend);
        }
    }
    /**
     * Immediately flushes all queued logs
     */
    flush() {
        // Cancel any pending debounced flush
        this.debouncedFlush.cancel();
        // Perform the flush immediately
        this.performFlush();
    }
    /**
     * Updates transport options
     */
    configure(options) {
        var _a, _b;
        const oldDebounceMs = this.transportOptions.debounceMs;
        this.transportOptions = {
            ...this.transportOptions,
            ...options,
            batchSize: Math.max(1, (_a = options.batchSize) !== null && _a !== void 0 ? _a : this.transportOptions.batchSize),
            debounceMs: Math.max(0, (_b = options.debounceMs) !== null && _b !== void 0 ? _b : this.transportOptions.debounceMs),
        };
        // If debounce time changed, recreate the debounced function
        if (options.debounceMs !== undefined && oldDebounceMs !== this.transportOptions.debounceMs) {
            this.debouncedFlush.cancel(); // Cancel any pending flush
            this.debouncedFlush = (0, lodash_debounce_1.default)(() => {
                this.performFlush();
            }, this.transportOptions.debounceMs);
        }
    }
    /**
     * Enables the transport
     */
    enable() {
        this.transportOptions.enabled = true;
    }
    /**
     * Disables the transport and flushes remaining logs
     */
    disable() {
        this.transportOptions.enabled = false;
        this.flush();
    }
    /**
     * Cleanup method to be called when transport is no longer needed
     */
    destroy() {
        this.flush();
        this.debouncedFlush.cancel();
    }
    assertOptionIsSet(key) {
        if (this.transportOptions[key] === undefined) {
            throw new Error(`${String(key)} is not set on transport`);
        }
    }
}
exports.Transport = Transport;
