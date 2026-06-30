import type {NextFunction, Request, Response} from 'express';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {rateLimitMiddleware} from '../middleware/rateLimit.middleware';

function makeReq(ip = '127.0.0.1'): Request {
  return {ip, method: 'POST', originalUrl: '/mcp'} as unknown as Request;
}

function makeRes(): Response {
  const res = {status: vi.fn(), json: vi.fn(), setHeader: vi.fn()} as unknown as Response;
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
}

describe('rateLimitMiddleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the threshold', () => {
    const next = vi.fn() as NextFunction;
    const res = makeRes();
    rateLimitMiddleware(makeReq(), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('blocks requests above the threshold in the same window', () => {
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    for (let i = 0; i < 120; i++) {
      rateLimitMiddleware(makeReq('10.0.0.1'), res, next);
    }

    rateLimitMiddleware(makeReq('10.0.0.1'), res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({error: 'Too many requests. Please try again later.'});
  });
});
