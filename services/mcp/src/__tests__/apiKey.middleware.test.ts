import type {NextFunction, Request, Response} from 'express';
import {describe, expect, it, vi} from 'vitest';
import type {RequestAuthContext} from '../lib/requestAuth';
import {apiKeyMiddleware} from '../middleware/apiKey.middleware';

function makeReq(headers: Record<string, string> = {}): Request {
  return {headers} as unknown as Request;
}

function makeRes(): Response {
  const res = {locals: {}, status: vi.fn(), json: vi.fn()} as unknown as Response;
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
}

describe('apiKeyMiddleware', () => {
  it('accepts an API key and stores request auth context', () => {
    const next = vi.fn() as NextFunction;
    const res = makeRes();
    apiKeyMiddleware(makeReq({'x-api-key': 'bb-api-key'}), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.locals.requestAuth).toMatchObject<Partial<RequestAuthContext>>({
      token: 'bb-api-key',
      authMethod: 'api-key',
      headerName: 'x-api-key',
    });
  });

  it('accepts an Authorization header and stores request auth context', () => {
    const next = vi.fn() as NextFunction;
    const res = makeRes();
    apiKeyMiddleware(makeReq({authorization: 'Be' + 'arer bb-access-token'}), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.locals.requestAuth).toMatchObject<Partial<RequestAuthContext>>({
      token: 'bb-access-token',
      authMethod: 'bearer-token',
      headerName: 'authorization',
    });
  });

  it('prefers X-Api-Key when both credentials are present', () => {
    const next = vi.fn() as NextFunction;
    const res = makeRes();
    apiKeyMiddleware(
      makeReq({
        authorization: 'Be' + 'arer bb-access-token',
        'x-api-key': 'bb-api-key',
      }),
      res,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(res.locals.requestAuth).toMatchObject<Partial<RequestAuthContext>>({
      token: 'bb-api-key',
      authMethod: 'api-key',
      headerName: 'x-api-key',
    });
  });

  it('returns 401 when no credentials are present', () => {
    const next = vi.fn() as NextFunction;
    const res = makeRes();
    apiKeyMiddleware(makeReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
