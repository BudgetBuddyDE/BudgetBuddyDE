import { type LogLevel, type LogMeta } from '../logger';
/**
 * Represents a log entry that will be transported
 */
export type LogEntry = {
    dateTime: Date;
    level: LogLevel;
    /**
     * Formatted log message
     */
    message: string;
    meta?: LogMeta;
};
/**
 * Configuration options for a transport
 */
export type TransportOptions = {
    /**
     * The batch size for sending logs
     * @default 10
     */
    batchSize?: number;
    /**
     * Debounce delay in milliseconds before sending logs
     * @default 1000
     */
    debounceMs?: number;
    /**
     * Minimum log level to transport
     * @default LogLevel.INFO
     */
    level?: LogLevel;
    /**
     * Whether to enable the transport
     * @default true
     */
    enabled?: boolean;
    /**
     * Label for the transport, useful for distinguishing multiple transports
     * @default '' (empty string)
     */
    label?: string;
};
export type InjectableTransportOptions = Pick<TransportOptions, 'level' | 'enabled' | 'label'>;
/**
 * Abstract base class for log transports
 */
export declare abstract class Transport {
    protected transportOptions: Required<Omit<TransportOptions, 'level' | 'enabled'>> & Pick<TransportOptions, 'level' | 'enabled'>;
    private logQueue;
    private debouncedFlush;
    constructor(options: TransportOptions);
    get optionsWithoutAssertion(): Required<Omit<TransportOptions, "level" | "enabled">> & Pick<TransportOptions, "level" | "enabled">;
    get options(): Required<TransportOptions>;
    /**
     * Abstract method that transports must implement to send log batches
     */
    protected abstract sendBatch(logs: LogEntry[]): Promise<void> | void;
    setLabel(label: string): void;
    setLogLevel(level: LogLevel): void;
    /**
     * Adds a log entry to the transport queue
     */
    addLogToQueue(entry: LogEntry): void;
    /**
     * Internal method that performs the actual flush operation
     */
    private performFlush;
    /**
     * Immediately flushes all queued logs
     */
    flush(): void;
    /**
     * Updates transport options
     */
    configure(options: Partial<TransportOptions>): void;
    /**
     * Enables the transport
     */
    enable(): void;
    /**
     * Disables the transport and flushes remaining logs
     */
    disable(): void;
    /**
     * Cleanup method to be called when transport is no longer needed
     */
    destroy(): void;
    private assertOptionIsSet;
}
