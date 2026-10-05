import type {Response} from 'express';
import {z} from 'zod';
import {ApiResponse, NotFoundError} from '../models';
import {executeDomain, normalizeResponse} from './response';

vi.mock('../lib/logger', () => ({logger: {error: vi.fn()}}));
function response() {
  return {
    locals: {},
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn(),
  } as unknown as Response;
}
it('retains present metadata and omits absent metadata like REST', () => {
  const value = normalizeResponse(ApiResponse.builder().withMessage('ok').withFrom('db').withData([]).build());
  expect(value).toMatchObject({message: 'ok', from: 'db', data: []});
  expect(value).not.toHaveProperty('error');
  expect(normalizeResponse(ApiResponse.builder().build())).toEqual({status: 200, data: null});
});
it('sends successful internal results and marks invalidation as handled', async () => {
  const res = response();
  await executeDomain(res, async () => ApiResponse.builder().withData('result').build());
  expect(res.json).toHaveBeenCalledWith({status: 200, data: 'result'});
  expect(res.locals.domainMutationHandled).toBe(true);
});
it('reports invalid shared inputs as 400', async () => {
  const res = response();
  await executeDomain(res, async () => {
    z.string().parse(42);
    return ApiResponse.builder().build();
  });
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({message: 'Validation Error'}));
});
it.each([new Error('database password'), 'database password', new NotFoundError('Not found')])(
  'maps thrown domain errors safely',
  async error => {
    const res = response();
    await executeDomain(res, async () => {
      throw error;
    });
    expect(res.status).toHaveBeenCalledWith(error instanceof NotFoundError ? 404 : 500);
    expect(JSON.stringify(vi.mocked(res.json).mock.calls)).not.toContain('password');
  },
);
