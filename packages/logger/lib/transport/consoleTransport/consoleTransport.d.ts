import { type LogClientOptions, type LogLevel, type LogMeta } from '../../logger';
import { type LogEntry, Transport, type TransportOptions } from '../transport';
export type ConsoleTransportOptions = TransportOptions & Pick<LogClientOptions, 'hideMeta'> & {
    /**
     * Formats a log message.
     * @param dateTime The date and time of the log entry.
     * @param level The log level of the message.
     * @param label The label of the logger.
     * @param message The log message. The parameters will already be resolved, so you can use it directly.
     * @param meta Optional metadata to include in the log message.
     * @returns The formatted log message.
     */
    format?: (dateTime: Date, level: LogLevel, label: string, message: string, meta?: LogMeta) => string;
};
/**
 * Console transport that outputs logs to the console
 */
export declare class ConsoleTransport extends Transport {
    private hideMeta;
    private customFormatFunc;
    constructor(options: ConsoleTransportOptions);
    protected sendBatch(logs: LogEntry[]): void;
}
