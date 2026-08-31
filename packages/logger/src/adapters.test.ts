import {createConsoleSink, formatConsoleEvent} from './console';
import {MemoryLogger} from './testing';
import {createWinstonSink, serializeError, toWinstonLogEvent} from './winston';

describe('adapters', () => {
  it('forwards complete events through the matching console method', () => {
    const info = vi.fn();
    const sink = createConsoleSink({target: {info}});
    const event = {level: 'info' as const, message: 'Started'};

    sink(event);

    expect(info).toHaveBeenCalledWith(event);
  });

  it('formats console events and forwards raw errors separately', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-31T12:00:00.000Z'));
    const writeError = vi.fn();
    const failure = new Error('connection refused');
    const sink = createConsoleSink({target: {error: writeError}, formatter: formatConsoleEvent});

    sink({level: 'error', message: 'Request failed', service: 'backend', requestId: 'request', error: failure});

    expect(writeError).toHaveBeenCalledWith(
      '2026-08-31T12:00:00.000Z [ERROR] Request failed - {"service":"backend","requestId":"request"}',
      failure,
    );
    vi.useRealTimers();
  });

  it('shares MemoryLogger events with child loggers', () => {
    const logger = new MemoryLogger({context: {service: 'test'}});

    logger.child({requestId: 'request'}).debug('Processed', {entityId: 'entity'});

    expect(logger.events).toEqual([
      {service: 'test', requestId: 'request', entityId: 'entity', level: 'debug', message: 'Processed'},
    ]);
  });

  it('serializes error details for Winston without adding splat metadata', () => {
    const cause = new Error('database unavailable');
    const error = Object.assign(new Error('request failed', {cause}), {code: 'DATABASE_UNAVAILABLE'});
    Object.defineProperty(error, 'retryable', {value: true});
    const event = {level: 'error' as const, message: 'Failed', error, requestId: 'request'};

    expect(serializeError(error)).toMatchObject({
      name: 'Error',
      message: 'request failed',
      stack: expect.any(String),
      code: 'DATABASE_UNAVAILABLE',
      retryable: true,
      cause: expect.objectContaining({message: 'database unavailable'}),
    });
    expect(toWinstonLogEvent(event)).toEqual(
      expect.objectContaining({level: 'error', message: 'Failed', requestId: 'request'}),
    );
    expect(Object.getOwnPropertySymbols(toWinstonLogEvent(event))).not.toContain(Symbol.for('splat'));
  });

  it('writes object events directly to Winston', () => {
    const log = vi.fn();
    const sink = createWinstonSink({log} as never);

    sink({level: 'warn', message: 'Slow request', duration: 200});

    expect(log).toHaveBeenCalledWith({level: 'warn', message: 'Slow request', duration: 200});
  });
});
