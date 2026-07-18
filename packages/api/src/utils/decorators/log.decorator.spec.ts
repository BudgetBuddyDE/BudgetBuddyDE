import {describe, expect, it, vi} from 'vitest';
import {createLogDecorator, log, type LogSink} from './log.decorator';

const context = {name: 'loadData'} as ClassMethodDecoratorContext<object, (...args: unknown[]) => unknown>;

function createSink(): LogSink {
  return {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe('log decorator', () => {
  it('accepts options through the log decorator factory syntax', () => {
    const logger = createSink();
    const decorated = log({logArgs: true, logResult: false, logger})(function () {
      return 'ok';
    }, context);

    decorated.call({constructor: {name: 'TestService'}}, {visible: 'ok'});

    expect(logger.debug).toHaveBeenCalledWith(
      'Method called',
      expect.objectContaining({args: '{"type":"array","length":1,"items":[{"visible":"ok"}]}'}),
    );
    expect(logger.debug).toHaveBeenCalledWith('Method finished', expect.objectContaining({status: 'success'}));
  });

  it('logs structured success metadata and redacts sensitive arguments', () => {
    const logger = createSink();
    const decorated = createLogDecorator({logArgs: true, logResult: true, logger})(function () {
      return {id: 'result-1', data: [{id: 'item-1'}]};
    }, context);

    decorated.call({constructor: {name: 'TestService'}}, {token: 'secret-value', visible: 'ok'});

    expect(logger.debug).toHaveBeenCalledWith('Method called', {
      className: 'TestService',
      methodName: 'loadData',
      args: '{"type":"array","length":1,"items":[{"token":"[Redacted]","visible":"ok"}]}',
    });
    expect(logger.debug).toHaveBeenCalledWith('Method finished', {
      className: 'TestService',
      methodName: 'loadData',
      status: 'success',
      durationMs: expect.any(Number),
      result: '{"type":"object","keys":["id","data"],"id":"result-1","dataLength":1}',
    });
  });

  it('stringifies non-Error object failures', () => {
    const logger = createSink();
    const failure = {reason: 'request failed', details: ['timeout']};
    const decorated = createLogDecorator({logger})(function () {
      throw failure;
    }, context);

    let thrown: unknown;
    try {
      decorated.call({constructor: {name: 'TestService'}});
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBe(failure);
    expect(logger.error).toHaveBeenCalledWith('Method failed', {
      className: 'TestService',
      methodName: 'loadData',
      status: 'error',
      durationMs: expect.any(Number),
      error: {
        value: '{"reason":"request failed","details":{"type":"array","length":1,"items":["timeout"]}}',
      },
    });
  });

  it('logs rejected promises and preserves the original error', async () => {
    const logger = createSink();
    const expectedError = new Error('request failed');
    const decorated = createLogDecorator({logger})(async function () {
      throw expectedError;
    }, context);

    await expect(decorated.call({constructor: {name: 'TestService'}})).rejects.toBe(expectedError);

    expect(logger.error).toHaveBeenCalledWith('Method failed', {
      className: 'TestService',
      methodName: 'loadData',
      status: 'error',
      durationMs: expect.any(Number),
      error: {
        name: 'Error',
        message: 'request failed',
        stack: expectedError.stack,
      },
    });
  });

  it('logs tuple-based service errors without changing the return value', () => {
    const logger = createSink();
    const expectedError = new Error('service error');
    const decorated = createLogDecorator({logger})(function () {
      return [null, expectedError] as const;
    }, context);

    expect(decorated.call({constructor: {name: 'TestService'}})).toEqual([null, expectedError]);
    expect(logger.error).toHaveBeenCalledWith(
      'Method returned an error result',
      expect.objectContaining({status: 'error', error: expect.objectContaining({message: 'service error'})}),
    );
  });

  it('marks calls over the threshold as slow', () => {
    const logger = createSink();
    const now = vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1801);
    const decorated = createLogDecorator({slowThresholdMs: 500, logger})(function () {
      return true;
    }, context);

    decorated.call({constructor: {name: 'TestService'}});

    expect(logger.warn).toHaveBeenCalledWith(
      'Slow method call',
      expect.objectContaining({status: 'success', durationMs: 801}),
    );
    now.mockRestore();
  });
});
