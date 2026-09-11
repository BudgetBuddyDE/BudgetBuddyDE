import type {Logger} from '@budgetbuddyde/logger';
import {describe, expect, it, vi} from 'vitest';
import {log} from './log.decorator';

const context = {name: 'loadData'} as ClassMethodDecoratorContext<object, (...args: unknown[]) => unknown>;

function createSink(): Pick<Logger, 'debug' | 'warn' | 'error'> {
  return {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe('log decorator', () => {
  it('logs structured success metadata and a bounded result summary', () => {
    const logger = createSink();
    const decorated = log(function () {
      return {id: 'result-1', data: [{id: 'item-1'}]};
    }, context);

    decorated.call({constructor: {name: 'TestService'}, logger}, {visible: 'ok'});

    expect(logger.debug).toHaveBeenCalledWith('Method called', {
      className: 'TestService',
      methodName: 'loadData',
    });
    expect(logger.debug).toHaveBeenCalledWith('Method finished', {
      className: 'TestService',
      methodName: 'loadData',
      status: 'success',
      durationMs: expect.any(Number),
      result: '{"type":"object","keys":["id","data"],"id":"result-1","dataLength":1}',
    });
  });

  it('uses the logger injected on the decorated instance', () => {
    const logger = createSink();
    const decorated = log(function () {
      return 'ok';
    }, context);

    decorated.call({constructor: {name: 'TestService'}, logger});

    expect(logger.debug).toHaveBeenCalledWith('Method called', expect.objectContaining({className: 'TestService'}));
  });

  it('stringifies and redacts non-Error object failures', () => {
    const logger = createSink();
    const failure = {token: 'secret-value', reason: 'request failed', details: ['timeout']};
    const decorated = log(function () {
      throw failure;
    }, context);

    let thrown: unknown;
    try {
      decorated.call({constructor: {name: 'TestService'}, logger});
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
        value:
          '{"token":"[Redacted]","reason":"request failed","details":{"type":"array","length":1,"items":["timeout"]}}',
      },
    });
  });

  it('logs rejected promises and preserves the original error', async () => {
    const logger = createSink();
    const expectedError = new Error('request failed');
    const decorated = log(async function () {
      throw expectedError;
    }, context);

    await expect(decorated.call({constructor: {name: 'TestService'}, logger})).rejects.toBe(expectedError);

    expect(logger.error).toHaveBeenCalledWith('Method failed', expectedError, {
      className: 'TestService',
      methodName: 'loadData',
      status: 'error',
      durationMs: expect.any(Number),
    });
  });

  it('logs tuple-based service errors without changing the return value', () => {
    const logger = createSink();
    const expectedError = new Error('service error');
    const decorated = log(function () {
      return [null, expectedError] as const;
    }, context);

    expect(decorated.call({constructor: {name: 'TestService'}, logger})).toEqual([null, expectedError]);
    expect(logger.error).toHaveBeenCalledWith(
      'Method returned an error result',
      expectedError,
      expect.objectContaining({status: 'error'}),
    );
  });

  it('marks calls over the threshold as slow', () => {
    const logger = createSink();
    const now = vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1801);
    const decorated = log(function () {
      return true;
    }, context);

    decorated.call({constructor: {name: 'TestService'}, logger});

    expect(logger.warn).toHaveBeenCalledWith(
      'Slow method call',
      expect.objectContaining({status: 'success', durationMs: 801}),
    );
    now.mockRestore();
  });
});
