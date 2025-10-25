import type {LogLevel} from '../logger';
import type {InjectableTransportOptions, LogEntry, Transport} from '../transport';

/**
 * Manages multiple transports for a logger
 */
export class TransportManager {
  private transports: Transport[];

  constructor(transports: Transport[] = []) {
    this.transports = transports;
  }

  /**
   * Adds a transport to the manager
   */
  add(transport: Transport): void {
    this.transports.push(transport);
  }

  /**
   * Removes a transport from the manager
   */
  remove(transport: Transport): void {
    const index = this.transports.indexOf(transport);
    if (index > -1) {
      this.transports.splice(index, 1);
      transport.destroy();
    }
  }

  /**
   * Sends a log entry to all transports
   */
  addLogToQueue(entry: LogEntry): void {
    for (const transport of this.transports) {
      transport.addLogToQueue(entry);
    }
  }

  /**
   * Flushes all transports
   */
  flush(): void {
    for (const transport of this.transports) {
      transport.flush();
    }
  }

  /**
   * Destroys all transports and clears the list
   */
  destroy(): void {
    for (const transport of this.transports) {
      transport.destroy();
    }
    this.transports = [];
  }

  setLogLevel(level: LogLevel) {
    for (const transport of this.transports) {
      transport.setLogLevel(level);
    }
  }

  injectOptions(options: InjectableTransportOptions) {
    for (const transport of this.registeredTransports) {
      const transportOptions = transport.optionsWithoutAssertion;
      const appliedOptions: typeof options = {};
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
  get count(): number {
    return this.transports.length;
  }

  /**
   * Gets all registered transports
   */
  get registeredTransports(): readonly Transport[] {
    return [...this.transports];
  }

  get all(): Transport[] {
    return this.transports;
  }
}
