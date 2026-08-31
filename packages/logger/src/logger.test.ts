import {createLogger, createNoopLogger, getLogLevel} from './logger';
import {formatLogMessage, normalizeLogEvent} from './normalizer';

describe('logger facade', () => {
  it('writes every supported level and observes the threshold', () => {
    const events: unknown[] = [];
    const logger = createLogger({sinks: [event => events.push(event)], threshold: 'info'});

    logger.trace('trace');
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(events).toMatchObject([{level: 'info'}, {level: 'warn'}, {level: 'error'}]);
  });

  it('merges root, child, and call context in precedence order without allowing reserved fields', () => {
    const events: unknown[] = [];
    const logger = createLogger({
      sinks: [event => events.push(event)],
      context: {service: 'root', shared: 'root', level: 'bad'},
    });

    logger.child({shared: 'child', requestId: 'request', message: 'bad'}).info('Saved', {
      shared: 'call',
      entityId: 'entity',
      error: 'bad',
    });

    expect(events).toEqual([
      {
        service: 'root',
        shared: 'call',
        requestId: 'request',
        entityId: 'entity',
        level: 'info',
        message: 'Saved',
      },
    ]);
  });

  it('forwards each normalized event to every sink in declaration order', () => {
    const received: string[] = [];
    const logger = createLogger({
      sinks: [event => received.push(`first:${event.message}`), event => received.push(`second:${event.message}`)],
    });

    logger.info('Saved', {entityId: 'entity'});

    expect(received).toEqual(['first:Saved', 'second:Saved']);
  });

  it('does not invoke sinks below the configured threshold', () => {
    const sink = vi.fn();
    const logger = createLogger({sinks: [sink], threshold: 'silent'});

    logger.error('Ignored');

    expect(sink).not.toHaveBeenCalled();
  });

  it('creates a no-op logger whose children remain no-op', () => {
    const logger = createNoopLogger({service: 'test'});

    expect(() => logger.child({requestId: 'request'}).error('Ignored', new Error('failure'))).not.toThrow();
  });

  it('parses thresholds including the legacy crit value', () => {
    expect(getLogLevel(' TRACE ')).toBe('trace');
    expect(getLogLevel('silent')).toBe('silent');
    expect(getLogLevel('crit')).toBe('error');
    expect(getLogLevel('unknown')).toBe('info');
  });
});

describe('message normalization', () => {
  it('formats supported placeholders without consuming %%', () => {
    expect(formatLogMessage('name=%s count=%d json=%j %%', ['Ada', '4', {active: true}])).toBe(
      'name=Ada count=4 json={"active":true} %',
    );
  });

  it('uses a trailing plain object as metadata only when arguments exceed consuming placeholders', () => {
    const metadata = {requestId: 'request'};

    expect(normalizeLogEvent('info', 'User %s', ['Ada', metadata])).toMatchObject({
      message: 'User Ada',
      requestId: 'request',
    });
    expect(normalizeLogEvent('info', 'User %s', [metadata])).toEqual({
      level: 'info',
      message: 'User {"requestId":"request"}',
    });
  });

  it('keeps errors raw and excludes them from metadata and template arguments', () => {
    const error = new Error('failure');
    const event = normalizeLogEvent('error', 'Failed: %s', [error, 'retry', {requestId: 'request'}]);

    expect(event).toMatchObject({level: 'error', message: 'Failed: retry', requestId: 'request'});
    expect(event.error).toBe(error);
  });
});
