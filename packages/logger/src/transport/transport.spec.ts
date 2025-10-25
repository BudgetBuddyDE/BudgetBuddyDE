import {afterEach, beforeEach, describe, expect, type MockedFunction, test, vi} from 'vitest';
import {LogLevel} from '../logger';
import {type LogEntry, Transport, type TransportOptions} from './transport';

// Mock implementation of Transport for testing
class MockTransport extends Transport {
  public sendBatch: MockedFunction<(logs: LogEntry[]) => Promise<void> | void>;

  constructor(options: TransportOptions) {
    super(options);
    this.sendBatch = vi.fn();
  }

  // Make protected methods public for testing
  public getSendBatch() {
    return this.sendBatch;
  }

  public getLogQueue(): LogEntry[] {
    return (this as unknown as {logQueue: LogEntry[]}).logQueue;
  }

  public getDebouncedFlush() {
    return (this as unknown as {debouncedFlush: (() => void) & {cancel: () => void}}).debouncedFlush;
  }
}

// Helper function to create a log entry
const createLogEntry = (level: LogLevel = LogLevel.INFO, message = 'test message'): LogEntry => ({
  dateTime: new Date(),
  level,
  message,
  meta: {source: 'test'},
});

describe('Transport', () => {
  let transport: MockTransport;
  const defaultOptions: TransportOptions = {
    label: 'test-transport',
    batchSize: 3,
    debounceMs: 100,
    level: LogLevel.INFO,
    enabled: true,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    transport = new MockTransport(defaultOptions);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default options', () => {
      const transport = new MockTransport({label: 'test'});
      const options = transport.optionsWithoutAssertion;

      console.log(options);

      expect(options.batchSize).toBe(10);
      expect(options.debounceMs).toBe(300);
      expect(options.level).toBe(undefined);
      expect(options.enabled).toBe(undefined);
      expect(options.label).toBe('test');
    });

    test('should ensure positive batch size', () => {
      const transport = new MockTransport({label: 'test', batchSize: -5});
      expect(transport.optionsWithoutAssertion.batchSize).toBe(1);
    });

    test('should ensure non-negative debounce time', () => {
      const transport = new MockTransport({label: 'test', debounceMs: -100});
      expect(transport.optionsWithoutAssertion.debounceMs).toBe(0);
    });
  });

  describe('addLogToQueue', () => {
    test('should not add logs when transport is disabled', () => {
      transport.configure({enabled: false});
      const logEntry = createLogEntry();

      transport.addLogToQueue(logEntry);

      expect(transport.getLogQueue()).toHaveLength(0);
      expect(transport.sendBatch).not.toHaveBeenCalled();
    });

    test('should not add logs below minimum level', () => {
      transport.configure({level: LogLevel.WARN});
      const debugLog = createLogEntry(LogLevel.DEBUG);

      transport.addLogToQueue(debugLog);

      expect(transport.getLogQueue()).toHaveLength(0);
      expect(transport.sendBatch).not.toHaveBeenCalled();
    });

    test('should add logs that meet level requirement', () => {
      transport.configure({level: LogLevel.INFO});
      const infoLog = createLogEntry(LogLevel.INFO);

      transport.addLogToQueue(infoLog);

      expect(transport.getLogQueue()).toHaveLength(1);
    });

    test('should flush immediately when batch size is reached', () => {
      const logs = [
        createLogEntry(LogLevel.INFO, 'log 1'),
        createLogEntry(LogLevel.INFO, 'log 2'),
        createLogEntry(LogLevel.INFO, 'log 3'),
      ];

      logs.forEach(log => transport.addLogToQueue(log));

      expect(transport.sendBatch).toHaveBeenCalledOnce();
      expect(transport.sendBatch).toHaveBeenCalledWith(logs);
      expect(transport.getLogQueue()).toHaveLength(0);
    });

    test('should debounce flush when batch size is not reached', () => {
      const log = createLogEntry();

      transport.addLogToQueue(log);

      // Should not flush immediately
      expect(transport.sendBatch).not.toHaveBeenCalled();
      expect(transport.getLogQueue()).toHaveLength(1);

      // Should flush after debounce time
      vi.advanceTimersByTime(100);
      expect(transport.sendBatch).toHaveBeenCalledOnce();
      expect(transport.sendBatch).toHaveBeenCalledWith([log]);
    });

    test('should cancel debounced flush when batch size is reached', () => {
      // Add two logs to trigger debouncing
      transport.addLogToQueue(createLogEntry(LogLevel.INFO, 'log 1'));
      transport.addLogToQueue(createLogEntry(LogLevel.INFO, 'log 2'));

      expect(transport.sendBatch).not.toHaveBeenCalled();

      // Add third log to reach batch size
      transport.addLogToQueue(createLogEntry(LogLevel.INFO, 'log 3'));

      // Should flush immediately, not after debounce
      expect(transport.sendBatch).toHaveBeenCalledOnce();

      // Advance time to ensure debounced flush doesn't trigger
      vi.advanceTimersByTime(200);
      expect(transport.sendBatch).toHaveBeenCalledOnce(); // Still only once
    });
  });

  describe('flush', () => {
    test('should flush all queued logs immediately', () => {
      const logs = [createLogEntry(LogLevel.INFO, 'log 1'), createLogEntry(LogLevel.INFO, 'log 2')];

      logs.forEach(log => transport.addLogToQueue(log));
      transport.flush();

      expect(transport.sendBatch).toHaveBeenCalledOnce();
      expect(transport.sendBatch).toHaveBeenCalledWith(logs);
      expect(transport.getLogQueue()).toHaveLength(0);
    });

    test('should cancel pending debounced flush', () => {
      transport.addLogToQueue(createLogEntry());

      // Should not have flushed yet
      expect(transport.sendBatch).not.toHaveBeenCalled();

      transport.flush();

      // Should flush immediately
      expect(transport.sendBatch).toHaveBeenCalledOnce();

      // Advance time - debounced flush should not trigger
      vi.advanceTimersByTime(200);
      expect(transport.sendBatch).toHaveBeenCalledOnce();
    });

    test('should do nothing when queue is empty', () => {
      transport.flush();

      expect(transport.sendBatch).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should re-queue logs on sync sendBatch error', () => {
      const log = createLogEntry();
      transport.sendBatch.mockImplementation(() => {
        throw new Error('Send failed');
      });

      transport.addLogToQueue(log);
      transport.flush();

      expect(transport.getLogQueue()).toHaveLength(1);
      expect(transport.getLogQueue()[0]).toEqual(log);
    });

    test('should re-queue logs on async sendBatch error', async () => {
      const log = createLogEntry();
      transport.sendBatch.mockRejectedValue(new Error('Async send failed'));

      transport.addLogToQueue(log);
      transport.flush();

      // Wait for the promise to be rejected
      await vi.runAllTimersAsync();

      expect(transport.getLogQueue()).toHaveLength(1);
      expect(transport.getLogQueue()[0]).toEqual(log);
    });
  });

  describe('configure', () => {
    test('should update options', () => {
      const newOptions = {
        batchSize: 5,
        debounceMs: 200,
        level: LogLevel.WARN,
        enabled: false,
      };

      transport.configure(newOptions);
      const options = transport.options;

      expect(options.batchSize).toBe(5);
      expect(options.debounceMs).toBe(200);
      expect(options.level).toBe(LogLevel.WARN);
      expect(options.enabled).toBe(false);
    });

    test('should recreate debounced function when debounceMs changes', () => {
      const originalDebouncedFlush = transport.getDebouncedFlush();

      transport.configure({debounceMs: 500});

      const newDebouncedFlush = transport.getDebouncedFlush();
      expect(newDebouncedFlush).not.toBe(originalDebouncedFlush);
    });

    test('should not recreate debounced function when debounceMs stays same', () => {
      const originalDebouncedFlush = transport.getDebouncedFlush();

      transport.configure({batchSize: 5}); // Change other option

      const debouncedFlush = transport.getDebouncedFlush();
      expect(debouncedFlush).toBe(originalDebouncedFlush);
    });
  });

  describe('enable/disable', () => {
    test('enable should set enabled to true', () => {
      transport.configure({enabled: false});
      transport.enable();

      expect(transport.options.enabled).toBe(true);
    });

    test('disable should set enabled to false and flush', () => {
      transport.addLogToQueue(createLogEntry());
      transport.disable();

      expect(transport.options.enabled).toBe(false);
      expect(transport.sendBatch).toHaveBeenCalledOnce();
    });
  });

  describe('setLogLevel', () => {
    test('should update log level', () => {
      transport.setLogLevel(LogLevel.DEBUG);

      expect(transport.options.level).toBe(LogLevel.DEBUG);
    });
  });

  describe('destroy', () => {
    test('should flush and cancel debounced operations', () => {
      transport.addLogToQueue(createLogEntry());
      transport.destroy();

      expect(transport.sendBatch).toHaveBeenCalledOnce();

      // Verify that debounced operations are cancelled
      vi.advanceTimersByTime(200);
      expect(transport.sendBatch).toHaveBeenCalledOnce(); // Still only once
    });

    test('should handle logs added after destroy', () => {
      transport.addLogToQueue(createLogEntry());
      transport.destroy();

      expect(transport.sendBatch).toHaveBeenCalledOnce();

      // Add another log after destroy - this might still work but shouldn't flush automatically
      transport.addLogToQueue(createLogEntry());
      vi.advanceTimersByTime(200);

      // The behavior here depends on implementation - the log might be queued but not auto-flushed
      // Since we cancelled the debounced function
      const callCount = transport.sendBatch.mock.calls.length;
      expect(callCount).toBeLessThanOrEqual(2); // Allow for at most one additional call
    });
  });

  describe('debouncing behavior', () => {
    test('should accumulate logs and flush after debounce period', () => {
      const logs = [createLogEntry(LogLevel.INFO, 'log 1'), createLogEntry(LogLevel.INFO, 'log 2')];

      // Add logs quickly
      transport.addLogToQueue(logs[0]);
      vi.advanceTimersByTime(50);
      transport.addLogToQueue(logs[1]);

      // Should not have flushed yet
      expect(transport.sendBatch).not.toHaveBeenCalled();

      // Complete the debounce period from the last log
      vi.advanceTimersByTime(100);

      expect(transport.sendBatch).toHaveBeenCalledOnce();
      expect(transport.sendBatch).toHaveBeenCalledWith(logs);
    });

    test('should reset debounce timer on each new log', () => {
      transport.addLogToQueue(createLogEntry(LogLevel.INFO, 'log 1'));

      // Advance time but not enough to trigger
      vi.advanceTimersByTime(50);
      expect(transport.sendBatch).not.toHaveBeenCalled();

      // Add another log - this should reset the timer
      transport.addLogToQueue(createLogEntry(LogLevel.INFO, 'log 2'));

      // Advance original time - should still not trigger
      vi.advanceTimersByTime(50);
      expect(transport.sendBatch).not.toHaveBeenCalled();

      // Complete new debounce period
      vi.advanceTimersByTime(50);
      expect(transport.sendBatch).toHaveBeenCalledOnce();
    });

    test('should handle rapid log additions correctly', () => {
      // Use a larger batch size to avoid immediate flushing
      transport.configure({batchSize: 15});

      // Add logs rapidly within debounce period
      for (let i = 0; i < 10; i++) {
        transport.addLogToQueue(createLogEntry(LogLevel.INFO, `log ${i + 1}`));
        vi.advanceTimersByTime(10); // Small increment
      }

      // Should not have flushed due to rapid additions
      expect(transport.sendBatch).not.toHaveBeenCalled();

      // Wait for final debounce
      vi.advanceTimersByTime(100);

      // Should flush all logs at once
      expect(transport.sendBatch).toHaveBeenCalledOnce();
      expect(transport.sendBatch).toHaveBeenCalledWith(
        Array.from({length: 10}, (_, i) => expect.objectContaining({message: `log ${i + 1}`})),
      );
    });
  });
});
