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
  return {headers, requestId: 'request-id'} as Request;
}

function createResponse(): Response {
  return {locals: {}} as Response;
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

  it('marks requests authenticated with a session cookie', async () => {
    const req = createRequest({cookie: 'better-auth.session_token=session-token'});
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await setRequestContext(req, res, next);

    expect(req.context.authenticationMethod).toBe('session-cookie');
    expect(loggerFunctions.debug).toHaveBeenCalledWith('Request context set', {
      requestId: 'request-id',
      userId: 'user-id',
      authenticationMethod: 'session-cookie',
    });
    expect(res.locals.context).toBe(req.context);
    expect(next).toHaveBeenCalledOnce();
  });

  it('marks requests authenticated with an API key', async () => {
    const req = createRequest({'x-api-key': 'bb-api-key'});
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await setRequestContext(req, res, next);

    expect(req.context.authenticationMethod).toBe('api-key');
    expect(loggerFunctions.debug).toHaveBeenCalledWith('Request context set', {
      requestId: 'request-id',
      userId: 'user-id',
      authenticationMethod: 'api-key',
    });
    expect(next).toHaveBeenCalledOnce();
  });

  it('prefers the API key when both credential types are present', async () => {
    const req = createRequest({
      cookie: 'better-auth.session_token=session-token',
      'x-api-key': 'bb-api-key',
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await setRequestContext(req, res, next);

    expect(req.context.authenticationMethod).toBe('api-key');
  });

  it('ignores an empty API key header when a session cookie is used', async () => {
    const req = createRequest({
      cookie: 'better-auth.session_token=session-token',
      'x-api-key': ' ',
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await setRequestContext(req, res, next);

    expect(req.context.authenticationMethod).toBe('session-cookie');
  });
});
