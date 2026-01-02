import {describe, expect, it} from 'vitest';
import {ApiResponse, HTTPStatusCode} from '../../models';

describe('ApiResponse Model', () => {
  it('should build a successful response with data', () => {
    const response = ApiResponse.builder<{name: string}>()
      .withStatus(HTTPStatusCode.OK)
      .withMessage('Success')
      .withData({name: 'Test'})
      .build();

    expect(response.status).toBe(HTTPStatusCode.OK);
    expect(response.message).toBe('Success');
    expect(response.data).toEqual({name: 'Test'});
  });

  it('should build an error response from Error object', () => {
    const error = new Error('Test error');
    const response = ApiResponse.builder().fromError(error).build();

    expect(response.status).toBe(HTTPStatusCode.INTERNAL_SERVER_ERROR);
    expect(response.message).toBe('Test error');
  });

  it('should include total count when provided', () => {
    const response = ApiResponse.builder<string[]>()
      .withStatus(HTTPStatusCode.OK)
      .withData(['item1', 'item2'])
      .withTotalCount(2)
      .build();

    expect(response.totalCount).toBe(2);
  });

  it('should include from source when provided', () => {
    const response = ApiResponse.builder().withStatus(HTTPStatusCode.OK).withFrom('db').build();

    expect(response.from).toBe('db');
  });

  it('should default to OK status if not specified', () => {
    const response = ApiResponse.builder().withMessage('Test').build();

    expect(response.status).toBe(HTTPStatusCode.OK);
  });

  it('should handle unauthorized status', () => {
    const response = ApiResponse.builder().withStatus(HTTPStatusCode.UNAUTHORIZED).withMessage('Unauthorized').build();

    expect(response.status).toBe(HTTPStatusCode.UNAUTHORIZED);
    expect(response.message).toBe('Unauthorized');
  });

  it('should handle not found status', () => {
    const response = ApiResponse.builder()
      .withStatus(HTTPStatusCode.NOT_FOUND)
      .withMessage('Resource not found')
      .build();

    expect(response.status).toBe(HTTPStatusCode.NOT_FOUND);
  });

  it('should handle bad request status', () => {
    const response = ApiResponse.builder().withStatus(HTTPStatusCode.BAD_REQUEST).withMessage('Invalid input').build();

    expect(response.status).toBe(HTTPStatusCode.BAD_REQUEST);
  });
});
