import {formatMessage, type LogClientOptions, type LogLevel, type LogMeta, printMessage} from '../../logger';
import {type LogEntry, Transport, type TransportOptions} from '../transport';

export type ConsoleTransportOptions = TransportOptions &
  Pick<LogClientOptions, 'hideMeta'> & {
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
export class ConsoleTransport extends Transport {
  private hideMeta: boolean;
  private customFormatFunc: ConsoleTransportOptions['format'];

  constructor(options: ConsoleTransportOptions) {
    super({
      label: options.label,
      batchSize: options.batchSize ?? 1,
      debounceMs: options.debounceMs ?? 0,
      level: options.level,
      enabled: options.enabled,
    });
    this.hideMeta = options.hideMeta ?? false;
    this.customFormatFunc = options.format;
  }

  protected sendBatch(logs: LogEntry[]): void {
    for (const log of logs) {
      printMessage(
        log.level,
        this.customFormatFunc
          ? this.customFormatFunc(log.dateTime, log.level, this.options.label, log.message, log.meta)
          : formatMessage(log.dateTime, log.level, log.message, this.options.label),
        log.meta,
        this.hideMeta,
      );
    }
  }
}
