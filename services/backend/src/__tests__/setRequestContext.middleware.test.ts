import type {NextFunction, Request, Response} from 'express';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {getSession, loggerFunctions} = vi.hoisted(() => ({
  getSession: vi.fn(),
  loggerFunctions: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../lib', () => ({
  authClient: {getSession},
  logger: {
    child: () => loggerFunctions,
  },
}));

import {setRequestContext} from '../middleware/setRequestContext.middleware';

function createRequest(headers: Request['headers']): Request {
  return {headers} as Request;
}

function createResponse(): Response {
  return {
    locals: {},
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('setRequestContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({
      data: {
        user: {id: 'user-id'},
        session: {id: 'session-id'},
      },
      error: null,
    });
  });

  it('sets the request context from the returned session', async () => {
    const req = createRequest({cookie: 'better-auth.session_token=session-token'});
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await setRequestContext(req, res, next);

    expect(req.context.user).toMatchObject({id: 'user-id'});
    expect(req.context.session).toMatchObject({id: 'session-id'});
    expect(res.locals.context).toBe(req.context);
    expect(next).toHaveBeenCalledOnce();
  });

  it('forwards only the required authentication headers upstream', async () => {
    const req = createRequest({
      cookie: 'better-auth.session_token=session-token',
      authorization: 'Bearer token',
      'x-api-key': 'bb-api-key',
      'x-unrelated': 'should-not-be-forwarded',
    });

    await setRequestContext(req, createResponse(), vi.fn() as NextFunction);

    const headers = getSession.mock.calls[0][0].fetchOptions.headers as Headers;
    expect(headers.get('cookie')).toBe('better-auth.session_token=session-token');
    expect(headers.get('authorization')).toBe('Bearer token');
    expect(headers.get('x-api-key')).toBe('bb-api-key');
    expect(headers.get('x-unrelated')).toBeNull();
  });

  it('bounds the auth-service request with an abort signal', async () => {
    await setRequestContext(createRequest({}), createResponse(), vi.fn() as NextFunction);

    const signal = getSession.mock.calls[0][0].fetchOptions.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it('returns 401 when no session is returned', async () => {
    getSession.mockResolvedValueOnce({data: null, error: null});
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await setRequestContext(createRequest({}), res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns a generic 503 and logs upstream errors server-side', async () => {
    const upstreamError = new Error('upstream failure');
    getSession.mockRejectedValueOnce(upstreamError);
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await setRequestContext(createRequest({}), res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(loggerFunctions.error).toHaveBeenCalledWith('Authentication service request failed', upstreamError);
    expect(next).not.toHaveBeenCalled();
  });
});
