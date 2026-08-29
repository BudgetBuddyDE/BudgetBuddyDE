import type {Request} from 'express';
import {ipKeyGenerator} from 'express-rate-limit';

export function applicationExportRateLimitKey(req: Pick<Request, 'context' | 'ip'>): string {
  return req.context.user?.id ?? ipKeyGenerator(req.ip ?? 'unknown');
}
