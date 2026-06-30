import type {NextFunction, Request, Response} from 'express';
import {describe, expect, it, vi} from 'vitest';

const mockConfig = vi.hoisted(() => ({
  config: {
    service: 'mcp-service',
    version: '0.1.0',
    mcpApiKey: null as string | null,
  },
}));

vi.mock('../config', () => mockConfig);

import {apiKeyMiddleware} from '../middleware/apiKey.middleware';

function makeReq(apiKey?: string): Request {
  return {headers: apiKey ? {'x-api-key': apiKey} : {}} as unknown as Request;
}

function makeRes(): Response {
  const res = {status: vi.fn(), json: vi.fn()} as unknown as Response;
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
}

describe('apiKeyMiddleware', () => {
  it('calls next() when no MCP_API_KEY is configured', () => {
    mockConfig.config.mcpApiKey = null;
    const next = vi.fn() as NextFunction;
    apiKeyMiddleware(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('calls next() when the correct API key is provided', () => {
    mockConfig.config.mcpApiKey = 'secret-key';
    const next = vi.fn() as NextFunction;
    apiKeyMiddleware(makeReq('secret-key'), makeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 401 when the API key is missing', () => {
    mockConfig.config.mcpApiKey = 'secret-key';
    const next = vi.fn() as NextFunction;
    const res = makeRes();
    apiKeyMiddleware(makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the API key is wrong', () => {
    mockConfig.config.mcpApiKey = 'secret-key';
    const next = vi.fn() as NextFunction;
    const res = makeRes();
    apiKeyMiddleware(makeReq('wrong-key'), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

