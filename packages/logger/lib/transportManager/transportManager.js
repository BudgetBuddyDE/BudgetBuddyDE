"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportManager = void 0;
/**
 * Manages multiple transports for a logger
 */
class TransportManager {
    constructor(transports = []) {
        this.transports = transports;
    }
    /**
     * Adds a transport to the manager
     */
    add(transport) {
        this.transports.push(transport);
    }
    /**
     * Removes a transport from the manager
     */
    remove(transport) {
        const index = this.transports.indexOf(transport);
        if (index > -1) {
            this.transports.splice(index, 1);
            transport.destroy();
        }
    }
    /**
     * Sends a log entry to all transports
     */
    addLogToQueue(entry) {
        for (const transport of this.transports) {
            transport.addLogToQueue(entry);
        }
    }
    /**
     * Flushes all transports
     */
    flush() {
        for (const transport of this.transports) {
            transport.flush();
        }
    }
    /**
     * Destroys all transports and clears the list
     */
    destroy() {
        for (const transport of this.transports) {
            transport.destroy();
        }
        this.transports = [];
    }
    setLogLevel(level) {
        for (const transport of this.transports) {
            transport.setLogLevel(level);
        }
    }
    injectOptions(options) {
        for (const transport of this.registeredTransports) {
            const transportOptions = transport.optionsWithoutAssertion;
            const appliedOptions = {};
            if (transportOptions.label === '') {
                appliedOptions.label = options.label;
            }
            if (transportOptions.enabled === undefined) {
                appliedOptions.enabled = options.enabled;
            }
            if (transportOptions.level === undefined) {
                appliedOptions.level = options.level;
            }
            transport.configure(appliedOptions);
        }
    }
    /**
     * Gets the number of registered transports
     */
    get count() {
        return this.transports.length;
    }
    /**
     * Gets all registered transports
     */
    get registeredTransports() {
        return [...this.transports];
    }
    get all() {
        return this.transports;
    }
}
exports.TransportManager = TransportManager;
