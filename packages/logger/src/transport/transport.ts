import { type LogLevel, type LogMeta, shouldPublishLog } from "../logger";
import { debounce } from "../utils";

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

export type InjectableTransportOptions = Pick<
	TransportOptions,
	"level" | "enabled" | "label"
>;

/**
 * Abstract base class for log transports
 */
export abstract class Transport {
	protected transportOptions: Required<
		Omit<TransportOptions, "level" | "enabled">
	> &
		Pick<TransportOptions, "level" | "enabled">;
	private logQueue: LogEntry[] = [];
	private debouncedFlush: (() => void) & { cancel: () => void };

	constructor(options: TransportOptions) {
		this.transportOptions = {
			batchSize: Math.max(1, options.batchSize ?? 10), // Ensure positive batch size
			debounceMs: Math.max(0, options.debounceMs ?? 300), // Ensure positive debounce time
			level: options.level,
			enabled: options.enabled,
			label: options.label ?? "", // Ensure label is always set. When empty an label will be injected by the transport manager
		};

		// Initialize debounced flush function
		this.debouncedFlush = debounce(() => {
			this.performFlush();
		}, this.transportOptions.debounceMs);
	}

	get optionsWithoutAssertion() {
		return this.transportOptions;
	}

	get options(): Required<TransportOptions> {
		this.assertOptionIsSet("level");
		this.assertOptionIsSet("enabled");

		return this.transportOptions;
	}

	/**
	 * Abstract method that transports must implement to send log batches
	 */
	protected abstract sendBatch(logs: LogEntry[]): Promise<void> | void;

	setLabel(label: string) {
		this.transportOptions.label = label;
	}

	setLogLevel(level: LogLevel): void {
		this.transportOptions.level = level;
	}

	/**
	 * Adds a log entry to the transport queue
	 */
	addLogToQueue(entry: LogEntry): void {
		this.assertOptionIsSet("level");

		if (!this.transportOptions.enabled) {
			return;
		}

		// Check if log level meets minimum requirement
		if (!shouldPublishLog(this.transportOptions.level, entry.level)) {
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
	private performFlush(): void {
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
					console.error("Transport failed to send batch:", error);
					// Re-queue failed logs
					this.logQueue.unshift(...logsToSend);
				});
			}
		} catch (error) {
			console.error("Transport failed to send batch:", error);
			// Re-queue failed logs on sync error as well
			this.logQueue.unshift(...logsToSend);
		}
	}

	/**
	 * Immediately flushes all queued logs
	 */
	flush(): void {
		// Cancel any pending debounced flush
		this.debouncedFlush.cancel();

		// Perform the flush immediately
		this.performFlush();
	}

	/**
	 * Updates transport options
	 */
	configure(options: Partial<TransportOptions>): void {
		const oldDebounceMs = this.transportOptions.debounceMs;

		this.transportOptions = {
			...this.transportOptions,
			...options,
			batchSize: Math.max(
				1,
				options.batchSize ?? this.transportOptions.batchSize,
			),
			debounceMs: Math.max(
				0,
				options.debounceMs ?? this.transportOptions.debounceMs,
			),
		};

		// If debounce time changed, recreate the debounced function
		if (
			options.debounceMs !== undefined &&
			oldDebounceMs !== this.transportOptions.debounceMs
		) {
			this.debouncedFlush.cancel(); // Cancel any pending flush
			this.debouncedFlush = debounce(() => {
				this.performFlush();
			}, this.transportOptions.debounceMs);
		}
	}

	/**
	 * Enables the transport
	 */
	enable(): void {
		this.transportOptions.enabled = true;
	}

	/**
	 * Disables the transport and flushes remaining logs
	 */
	disable(): void {
		this.transportOptions.enabled = false;
		this.flush();
	}

	/**
	 * Cleanup method to be called when transport is no longer needed
	 */
	destroy(): void {
		this.flush();
		this.debouncedFlush.cancel();
	}

	private assertOptionIsSet<K extends keyof TransportOptions>(
		key: K,
	): asserts this is { transportOptions: Required<Pick<TransportOptions, K>> } {
		if (this.transportOptions[key] === undefined) {
			throw new Error(`${String(key)} is not set on transport`);
		}
	}
}
