import type {NextFunction, Request, Response} from 'express';
import {logger} from './logRequest.middleware';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;

type Counter = {
  startedAt: number;
  count: number;
};

const requestCounts = new Map<string, Counter>();

function getClientKey(req: Request): string {
  return req.ip || 'unknown';
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const key = getClientKey(req);
  const existingCounter = requestCounts.get(key);

  if (!existingCounter || now - existingCounter.startedAt >= WINDOW_MS) {
    requestCounts.set(key, {startedAt: now, count: 1});
    next();
    return;
  }

  existingCounter.count += 1;
  if (existingCounter.count <= MAX_REQUESTS_PER_WINDOW) {
    next();
    return;
  }

  const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - existingCounter.startedAt)) / 1000);
  res.setHeader('Retry-After', String(retryAfterSeconds));
  logger.warn('Request rate-limited', {
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    maxRequestsPerWindow: MAX_REQUESTS_PER_WINDOW,
    windowMs: WINDOW_MS,
  });
  res.status(429).json({error: 'Too many requests. Please try again later.'});
}
