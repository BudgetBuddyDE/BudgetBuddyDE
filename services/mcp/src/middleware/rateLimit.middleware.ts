import type {NextFunction, Request, Response} from 'express';
import {config} from '../config';
import {logger} from '../lib/logger';

type Counter = {
  startedAt: number;
  count: number;
};

const requestCounts = new Map<string, Counter>();
const rateLimitLogger = logger.child({module: 'rateLimit'});

function getClientKey(req: Request): string {
  return req.ip || 'unknown';
}

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const key = getClientKey(req);
  const existingCounter = requestCounts.get(key);

  if (!existingCounter || now - existingCounter.startedAt >= config.rateLimit.windowMs) {
    requestCounts.set(key, {startedAt: now, count: 1});
    next();
    return;
  }

  existingCounter.count += 1;
  if (existingCounter.count <= config.rateLimit.limit) {
    next();
    return;
  }

  const retryAfterSeconds = Math.ceil((config.rateLimit.windowMs - (now - existingCounter.startedAt)) / 1000);
  res.setHeader('Retry-After', String(retryAfterSeconds));
  rateLimitLogger.warn('Request rate-limited', {
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    maxRequestsPerWindow: config.rateLimit.limit,
    windowMs: config.rateLimit.windowMs,
  });
  res.status(429).json({error: 'Too many requests. Please try again later.'});
}
