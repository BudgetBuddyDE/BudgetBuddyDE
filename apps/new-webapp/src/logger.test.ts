import {afterEach, describe, expect, it, vi} from 'vitest';
import {logger} from './logger';

describe('logger', () => {
  afterEach(() => vi.restoreAllMocks());

  it('removes sensitive context values', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logger.info('session changed', {userId: 'u1', sessionToken: 'private'});
    expect(spy).toHaveBeenCalledWith('[new-webapp] session changed', {userId: 'u1'});
  });
});
