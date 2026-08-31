import {createConsoleSink, formatConsoleEvent} from './console';
import {MemoryLogger} from './testing';

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
});
