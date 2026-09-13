import {describe, expect, it} from 'vitest';
import {ApiResponse, ConflictError, HTTPStatusCode, NotFoundError} from '../models';

describe('ApiResponse.fromError', () => {
  it('maps known client errors to explicit statuses', () => {
    expect(ApiResponse.builder().fromError(new NotFoundError('Missing')).build().status).toBe(HTTPStatusCode.NOT_FOUND);
    expect(ApiResponse.builder().fromError(new ConflictError('Duplicate')).build().status).toBe(
      HTTPStatusCode.CONFLICT,
    );
  });

  it('returns a safe generic 500 for unexpected errors', () => {
    const response = ApiResponse.builder().fromError(new Error('secret internal detail')).build();

    expect(response.status).toBe(HTTPStatusCode.INTERNAL_SERVER_ERROR);
    expect(response.message).toBe('Internal Server Error');
    expect(response.message).not.toContain('secret');
  });

  it('maps PostgreSQL unique violations to 409', () => {
    const error = Object.assign(new Error('duplicate key'), {code: '23505'});

    expect(ApiResponse.builder().fromError(error).build().status).toBe(HTTPStatusCode.CONFLICT);
  });
});
