import {ApiClientError} from './ApiClientError';
import {BackendError} from './BackendError';
import {CacheError} from './CacheError';
import {CustomError} from './CustomError';
import {DatabaseError} from './DatabaseError';
import {EnvironmentNotSetError} from './EnvironmentNotSetError';

describe('CustomError', () => {
  it.each([
    [new ApiClientError('API request failed'), ApiClientError],
    [new BackendError(500, 'Internal Server Error'), ApiClientError],
    [new CacheError('Cache request failed'), CacheError],
    [new DatabaseError('Database request failed'), DatabaseError],
    [new EnvironmentNotSetError('DATABASE_URL'), EnvironmentNotSetError],
  ])('preserves the %p inheritance chain', (error, errorClass) => {
    expect(error).toBeInstanceOf(errorClass);
    expect(error).toBeInstanceOf(CustomError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(error.constructor.name);
  });

  it('retains backend response metadata', () => {
    const cause = new Error('Connection reset');
    const error = new BackendError(502, 'Bad Gateway', {cause});

    expect(error.statusCode).toBe(502);
    expect(error.backendResponseText).toBe('Bad Gateway');
    expect(error.cause).toBe(cause);
    expect(error.getMessage()).toBe('Backend failed the request with status 502: Bad Gateway');
  });
});
