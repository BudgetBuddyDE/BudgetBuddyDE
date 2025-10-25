import type { LogLevel } from '../logger';
import type { InjectableTransportOptions, LogEntry, Transport } from '../transport';
/**
 * Manages multiple transports for a logger
 */
export declare class TransportManager {
    private transports;
    constructor(transports?: Transport[]);
    /**
     * Adds a transport to the manager
     */
    add(transport: Transport): void;
    /**
     * Removes a transport from the manager
     */
    remove(transport: Transport): void;
    /**
     * Sends a log entry to all transports
     */
    addLogToQueue(entry: LogEntry): void;
    /**
     * Flushes all transports
     */
    flush(): void;
    /**
     * Destroys all transports and clears the list
     */
    destroy(): void;
    setLogLevel(level: LogLevel): void;
    injectOptions(options: InjectableTransportOptions): void;
    /**
     * Gets the number of registered transports
     */
    get count(): number;
    /**
     * Gets all registered transports
     */
    get registeredTransports(): readonly Transport[];
    get all(): Transport[];
}
