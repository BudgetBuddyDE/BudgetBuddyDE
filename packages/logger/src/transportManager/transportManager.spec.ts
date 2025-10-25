import {beforeEach, describe, expect, type MockedFunction, test, vi} from 'vitest';
import {LogLevel} from '../logger';
import {type LogEntry, Transport, type TransportOptions} from '../transport';
import {TransportManager} from './transportManager';

// Mock implementation of Transport for testing
class MockTransport extends Transport {
  public addLogToQueue: MockedFunction<(entry: LogEntry) => void>;
  public flush: MockedFunction<() => void>;
  public destroy: MockedFunction<() => void>;
  public setLogLevel: MockedFunction<(level: LogLevel) => void>;

  constructor(options: TransportOptions) {
    super(options);

    // Mock all the methods we want to track
    this.addLogToQueue = vi.fn();
    this.flush = vi.fn();
    this.destroy = vi.fn();
    this.setLogLevel = vi.fn();
  }

  protected sendBatch(_logs: LogEntry[]): void {
    // Implementation handled by parent class
  }
}

// Helper function to create a log entry
const createLogEntry = (level: LogLevel = LogLevel.INFO, message = 'test message'): LogEntry => ({
  dateTime: new Date(),
  level,
  message,
  meta: {source: 'test'},
});

// Helper function to create a mock transport
const createMockTransport = (label: string): MockTransport => {
  return new MockTransport({
    label,
    batchSize: 10,
    debounceMs: 100,
    level: LogLevel.INFO,
    enabled: true,
  });
};

describe('TransportManager', () => {
  let transportManager: TransportManager;
  let transport1: MockTransport;
  let transport2: MockTransport;
  let transport3: MockTransport;

  beforeEach(() => {
    transport1 = createMockTransport('transport-1');
    transport2 = createMockTransport('transport-2');
    transport3 = createMockTransport('transport-3');
    transportManager = new TransportManager();
  });

  describe('constructor', () => {
    test('should initialize with empty transports array when no transports provided', () => {
      const manager = new TransportManager();

      expect(manager.count).toBe(0);
      expect(manager.registeredTransports).toHaveLength(0);
    });

    test('should initialize with provided transports', () => {
      const transports = [transport1, transport2];
      const manager = new TransportManager(transports);

      expect(manager.count).toBe(2);
      expect(manager.registeredTransports).toHaveLength(2);
      expect(manager.registeredTransports).toContain(transport1);
      expect(manager.registeredTransports).toContain(transport2);
    });

    test('should initialize with empty array when empty array provided', () => {
      const manager = new TransportManager([]);

      expect(manager.count).toBe(0);
      expect(manager.registeredTransports).toHaveLength(0);
    });
  });

  describe('add', () => {
    test('should add a single transport', () => {
      transportManager.add(transport1);

      expect(transportManager.count).toBe(1);
      expect(transportManager.registeredTransports).toContain(transport1);
    });

    test('should add multiple transports', () => {
      transportManager.add(transport1);
      transportManager.add(transport2);
      transportManager.add(transport3);

      expect(transportManager.count).toBe(3);
      expect(transportManager.registeredTransports).toContain(transport1);
      expect(transportManager.registeredTransports).toContain(transport2);
      expect(transportManager.registeredTransports).toContain(transport3);
    });

    test('should allow adding the same transport multiple times', () => {
      transportManager.add(transport1);
      transportManager.add(transport1);

      expect(transportManager.count).toBe(2);
      expect(transportManager.registeredTransports.filter(t => t === transport1)).toHaveLength(2);
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      transportManager.add(transport1);
      transportManager.add(transport2);
      transportManager.add(transport3);
    });

    test('should remove existing transport and call destroy', () => {
      transportManager.remove(transport2);

      expect(transportManager.count).toBe(2);
      expect(transportManager.registeredTransports).not.toContain(transport2);
      expect(transportManager.registeredTransports).toContain(transport1);
      expect(transportManager.registeredTransports).toContain(transport3);
      expect(transport2.destroy).toHaveBeenCalledOnce();
    });

    test('should handle removing non-existent transport gracefully', () => {
      const nonExistentTransport = createMockTransport('non-existent');

      transportManager.remove(nonExistentTransport);

      expect(transportManager.count).toBe(3);
      expect(nonExistentTransport.destroy).not.toHaveBeenCalled();
    });

    test('should remove first occurrence when transport added multiple times', () => {
      transportManager.add(transport1); // Add transport1 again
      expect(transportManager.count).toBe(4);

      transportManager.remove(transport1);

      expect(transportManager.count).toBe(3);
      expect(transportManager.registeredTransports.filter(t => t === transport1)).toHaveLength(1);
      expect(transport1.destroy).toHaveBeenCalledOnce();
    });

    test('should remove from empty manager without error', () => {
      const emptyManager = new TransportManager();

      expect(() => emptyManager.remove(transport1)).not.toThrow();
      expect(emptyManager.count).toBe(0);
    });
  });

  describe('addLogToQueue', () => {
    beforeEach(() => {
      transportManager.add(transport1);
      transportManager.add(transport2);
      transportManager.add(transport3);
    });

    test('should send log entry to all transports', () => {
      const logEntry = createLogEntry(LogLevel.INFO, 'test log');

      transportManager.addLogToQueue(logEntry);

      expect(transport1.addLogToQueue).toHaveBeenCalledOnce();
      expect(transport1.addLogToQueue).toHaveBeenCalledWith(logEntry);
      expect(transport2.addLogToQueue).toHaveBeenCalledOnce();
      expect(transport2.addLogToQueue).toHaveBeenCalledWith(logEntry);
      expect(transport3.addLogToQueue).toHaveBeenCalledOnce();
      expect(transport3.addLogToQueue).toHaveBeenCalledWith(logEntry);
    });

    test('should handle empty transport list', () => {
      const emptyManager = new TransportManager();
      const logEntry = createLogEntry();

      expect(() => emptyManager.addLogToQueue(logEntry)).not.toThrow();
    });

    test('should handle multiple log entries', () => {
      const log1 = createLogEntry(LogLevel.INFO, 'log 1');
      const log2 = createLogEntry(LogLevel.WARN, 'log 2');

      transportManager.addLogToQueue(log1);
      transportManager.addLogToQueue(log2);

      expect(transport1.addLogToQueue).toHaveBeenCalledTimes(2);
      expect(transport1.addLogToQueue).toHaveBeenNthCalledWith(1, log1);
      expect(transport1.addLogToQueue).toHaveBeenNthCalledWith(2, log2);
    });
  });

  describe('flush', () => {
    beforeEach(() => {
      transportManager.add(transport1);
      transportManager.add(transport2);
      transportManager.add(transport3);
    });

    test('should flush all transports', () => {
      transportManager.flush();

      expect(transport1.flush).toHaveBeenCalledOnce();
      expect(transport2.flush).toHaveBeenCalledOnce();
      expect(transport3.flush).toHaveBeenCalledOnce();
    });

    test('should handle empty transport list', () => {
      const emptyManager = new TransportManager();

      expect(() => emptyManager.flush()).not.toThrow();
    });

    test('should handle multiple flush calls', () => {
      transportManager.flush();
      transportManager.flush();

      expect(transport1.flush).toHaveBeenCalledTimes(2);
      expect(transport2.flush).toHaveBeenCalledTimes(2);
      expect(transport3.flush).toHaveBeenCalledTimes(2);
    });
  });

  describe('setLogLevel', () => {
    beforeEach(() => {
      transportManager.add(transport1);
      transportManager.add(transport2);
      transportManager.add(transport3);
    });

    test('should set log level on all transports', () => {
      transportManager.setLogLevel(LogLevel.DEBUG);

      expect(transport1.setLogLevel).toHaveBeenCalledOnce();
      expect(transport1.setLogLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
      expect(transport2.setLogLevel).toHaveBeenCalledOnce();
      expect(transport2.setLogLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
      expect(transport3.setLogLevel).toHaveBeenCalledOnce();
      expect(transport3.setLogLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
    });

    test('should handle different log levels', () => {
      transportManager.setLogLevel(LogLevel.ERROR);
      transportManager.setLogLevel(LogLevel.WARN);

      expect(transport1.setLogLevel).toHaveBeenCalledTimes(2);
      expect(transport1.setLogLevel).toHaveBeenNthCalledWith(1, LogLevel.ERROR);
      expect(transport1.setLogLevel).toHaveBeenNthCalledWith(2, LogLevel.WARN);
    });

    test('should handle empty transport list', () => {
      const emptyManager = new TransportManager();

      expect(() => emptyManager.setLogLevel(LogLevel.DEBUG)).not.toThrow();
    });
  });

  describe('destroy', () => {
    beforeEach(() => {
      transportManager.add(transport1);
      transportManager.add(transport2);
      transportManager.add(transport3);
    });

    test('should destroy all transports and clear the list', () => {
      transportManager.destroy();

      expect(transport1.destroy).toHaveBeenCalledOnce();
      expect(transport2.destroy).toHaveBeenCalledOnce();
      expect(transport3.destroy).toHaveBeenCalledOnce();
      expect(transportManager.count).toBe(0);
      expect(transportManager.registeredTransports).toHaveLength(0);
    });

    test('should handle empty transport list', () => {
      const emptyManager = new TransportManager();

      expect(() => emptyManager.destroy()).not.toThrow();
      expect(emptyManager.count).toBe(0);
    });

    test('should handle multiple destroy calls', () => {
      transportManager.destroy();
      transportManager.destroy();

      expect(transport1.destroy).toHaveBeenCalledOnce();
      expect(transportManager.count).toBe(0);
    });
  });

  describe('properties', () => {
    test('count should return correct number of transports', () => {
      expect(transportManager.count).toBe(0);

      transportManager.add(transport1);
      expect(transportManager.count).toBe(1);

      transportManager.add(transport2);
      expect(transportManager.count).toBe(2);

      transportManager.remove(transport1);
      expect(transportManager.count).toBe(1);
    });

    test('registeredTransports should return readonly copy', () => {
      transportManager.add(transport1);
      transportManager.add(transport2);

      const transports = transportManager.registeredTransports;

      expect(transports).toHaveLength(2);
      expect(transports).toContain(transport1);
      expect(transports).toContain(transport2);

      // Should be a copy, not the original array
      expect(transports).not.toBe(transportManager.all);
    });

    test('all should return transports array', () => {
      transportManager.add(transport1);
      transportManager.add(transport2);

      const allTransports = transportManager.all;

      expect(allTransports).toHaveLength(2);
      expect(allTransports).toContain(transport1);
      expect(allTransports).toContain(transport2);
    });
  });

  describe('integration scenarios', () => {
    test('should handle typical usage flow', () => {
      // Start with empty manager
      expect(transportManager.count).toBe(0);

      // Add transports
      transportManager.add(transport1);
      transportManager.add(transport2);
      expect(transportManager.count).toBe(2);

      // Set log level
      transportManager.setLogLevel(LogLevel.DEBUG);
      expect(transport1.setLogLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
      expect(transport2.setLogLevel).toHaveBeenCalledWith(LogLevel.DEBUG);

      // Send logs
      const logEntry = createLogEntry(LogLevel.INFO, 'test message');
      transportManager.addLogToQueue(logEntry);
      expect(transport1.addLogToQueue).toHaveBeenCalledWith(logEntry);
      expect(transport2.addLogToQueue).toHaveBeenCalledWith(logEntry);

      // Flush
      transportManager.flush();
      expect(transport1.flush).toHaveBeenCalled();
      expect(transport2.flush).toHaveBeenCalled();

      // Remove one transport
      transportManager.remove(transport1);
      expect(transportManager.count).toBe(1);
      expect(transport1.destroy).toHaveBeenCalled();

      // Send another log (should only go to remaining transport)
      const logEntry2 = createLogEntry(LogLevel.WARN, 'second message');
      transportManager.addLogToQueue(logEntry2);
      expect(transport2.addLogToQueue).toHaveBeenCalledWith(logEntry2);
      expect(transport1.addLogToQueue).toHaveBeenCalledTimes(1); // Still only the first call

      // Final cleanup
      transportManager.destroy();
      expect(transportManager.count).toBe(0);
      expect(transport2.destroy).toHaveBeenCalled();
    });

    test('should handle manager initialization with transports', () => {
      const preInitializedManager = new TransportManager([transport1, transport2]);

      expect(preInitializedManager.count).toBe(2);

      const logEntry = createLogEntry();
      preInitializedManager.addLogToQueue(logEntry);

      expect(transport1.addLogToQueue).toHaveBeenCalledWith(logEntry);
      expect(transport2.addLogToQueue).toHaveBeenCalledWith(logEntry);
    });

    test('should handle error conditions gracefully', () => {
      // Remove from empty manager
      expect(() => transportManager.remove(transport1)).not.toThrow();

      // Operate on empty manager
      expect(() => transportManager.flush()).not.toThrow();
      expect(() => transportManager.setLogLevel(LogLevel.DEBUG)).not.toThrow();
      expect(() => transportManager.addLogToQueue(createLogEntry())).not.toThrow();
      expect(() => transportManager.destroy()).not.toThrow();
    });
  });
});
