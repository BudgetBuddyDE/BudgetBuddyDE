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

vi.mock('../auth', () => ({auth: {api: {getSession}}}));
vi.mock('../lib/logger', () => ({
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
      user: {id: 'user-id'},
      session: {id: 'session-id'},
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

  it('passes only authentication credentials to the local auth API', async () => {
    const req = createRequest({
      cookie: 'better-auth.session_token=session-token',
      authorization: 'Bearer token',
      'x-api-key': 'bb-api-key',
      'x-unrelated': 'should-not-be-forwarded',
    });

    await setRequestContext(req, createResponse(), vi.fn() as NextFunction);

    const headers = getSession.mock.calls[0][0].headers as Headers;
    expect(headers.get('cookie')).toBe('better-auth.session_token=session-token');
    expect(headers.get('authorization')).toBe('Bearer token');
    expect(headers.get('x-api-key')).toBe('bb-api-key');
    expect(headers.get('x-unrelated')).toBeNull();
  });

  it('returns 401 when no session is returned', async () => {
    getSession.mockResolvedValueOnce(null);
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
    expect(loggerFunctions.error).toHaveBeenCalledWith('Authentication failed', upstreamError);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('session credentials and failures', () => {
  it('supports array-valued credential headers', async () => {
    getSession.mockResolvedValueOnce({user: {id: 'api-owner'}, session: {id: 'api-key-session'}});
    const req = createRequest({'x-api-key': ['bb-first', 'bb-second']});
    await setRequestContext(req, createResponse(), vi.fn());
    expect(getSession.mock.lastCall?.[0].headers.get('x-api-key')).toBe('bb-first, bb-second');
    expect(req.context.user?.id).toBe('api-owner');
  });

  it('normalizes non-Error rejections and exposes no internal details', async () => {
    getSession.mockRejectedValueOnce('private database error');
    const res = createResponse();
    await setRequestContext(createRequest({}), res, vi.fn());
    expect(loggerFunctions.error).toHaveBeenLastCalledWith('Authentication failed', expect.any(Error));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({status: 503, message: 'Authentication failed'}));
  });
});
